
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Optional, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, text, or_

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    Student,
    Driver,
    Bus,
    Route,
    BusAllocation,
    StudentRouteAssignment,
    Complaint,
    ComplaintStatusLog,
    DirectMessage,
    Announcement,
    Notification,
    User,
)
from app.permissions import require_management


router = APIRouter(
    prefix="/management/dashboard",
    tags=["Management Dashboard"],
    dependencies=[Depends(require_management)]
)

IST = ZoneInfo("Asia/Kolkata")


class ManagementComplaintResponsePayload(BaseModel):
    status: str = Field(..., description="Submitted, Under Review, In Progress, Resolved, Rejected")
    management_response: Optional[str] = Field(None, max_length=3000)


class ManagementMessageDispatchPayload(BaseModel):
    target_type: str = Field(..., description="'student', 'route', or 'all_active_students'")
    target_id: Optional[str] = Field(None, description="student_id, registration_number, or route_id")
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=1, max_length=4000)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):

    total_students = db.query(Student).count()
    total_drivers = db.query(Driver).count()
    total_buses = db.query(Bus).count()
    total_routes = db.query(Route).count()

    active_buses = db.query(Bus).filter(
        Bus.is_active.is_(True)
    ).count()

    active_routes = db.query(Route).filter(
        Route.is_active.is_(True)
    ).count()

    active_allocations = db.query(BusAllocation).filter(
        BusAllocation.status == "active",
        BusAllocation.start_date <= func.now(),
        (
            (BusAllocation.end_date.is_(None)) |
            (BusAllocation.end_date > func.now())
        )
    ).count()

    student_accounts_created = db.query(Student).filter(
        Student.user_id.isnot(None)
    ).count()

    driver_accounts_created = db.query(Driver).filter(
        Driver.user_id.isnot(None)
    ).count()

    return {
        "students": {
            "total": total_students,
            "accounts_created": student_accounts_created,
            "pending_registration": total_students - student_accounts_created
        },
        "drivers": {
            "total": total_drivers,
            "accounts_created": driver_accounts_created,
            "pending_registration": total_drivers - driver_accounts_created
        },
        "buses": {
            "total": total_buses,
            "active": active_buses
        },
        "routes": {
            "total": total_routes,
            "active": active_routes
        },
        "allocations": {
            "active": active_allocations
        }
    }


@router.get("/routes")
def route_overview(db: Session = Depends(get_db)):

    routes = db.query(Route).order_by(
        Route.area,
        Route.route_code
    ).all()

    result = []

    for route in routes:

        student_count = db.query(
            func.count(
                func.distinct(StudentRouteAssignment.student_id)
            )
        ).filter(
            StudentRouteAssignment.route_id == route.id,
            StudentRouteAssignment.status == "active",
            StudentRouteAssignment.start_date <= func.now(),
            (
                (StudentRouteAssignment.end_date.is_(None)) |
                (StudentRouteAssignment.end_date > func.now())
            )
        ).scalar()

        allocations = db.query(BusAllocation).filter(
            BusAllocation.route_id == route.id,
            BusAllocation.status == "active",
            BusAllocation.start_date <= func.now(),
            (
                (BusAllocation.end_date.is_(None)) |
                (BusAllocation.end_date > func.now())
            )
        ).all()

        buses = []

        for allocation in allocations:
            buses.append({
                "allocation_id": allocation.id,
                "bus_id": allocation.bus.id,
                "bus_number": allocation.bus.bus_number,
                "driver_id": allocation.driver.id,
                "driver_name": allocation.driver.driver_name
            })

        result.append({
            "route_id": route.id,
            "area": route.area,
            "route_code": route.route_code,
            "route_name": route.route_name,
            "is_active": route.is_active,
            "active_student_count": student_count,
            "active_bus_count": len(buses),
            "buses": buses
        })

    return {
        "total_routes": len(result),
        "routes": result
    }


# ============================================================================
# MANAGEMENT ANNOUNCEMENT & COMPLAINT WORKFLOWS
# ============================================================================

from typing import Optional
from pydantic import BaseModel, Field
from app.models import Announcement, Complaint, Notification


class ManagementAnnouncementPayload(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str = Field("general", max_length=50)
    priority: str = Field("normal", max_length=30)
    is_pinned: bool = False
    route_id: Optional[int] = None
    published_by: str = Field("Campus Transport Office", max_length=100)


class ManagementComplaintResponsePayload(BaseModel):
    status: str = Field(..., max_length=30)
    management_response: Optional[str] = Field(None, max_length=3000)


@router.get("/announcements")
def get_management_announcements(db: Session = Depends(get_db)):
    announcements = db.query(Announcement).order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).all()

    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "category": a.category,
            "priority": a.priority,
            "is_pinned": a.is_pinned,
            "route_id": a.route_id,
            "published_by": a.published_by,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in announcements
    ]


@router.post("/announcements")
def create_management_announcement(
    payload: ManagementAnnouncementPayload,
    db: Session = Depends(get_db)
):
    announcement = Announcement(
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category,
        priority=payload.priority,
        is_pinned=payload.is_pinned,
        route_id=payload.route_id,
        published_by=payload.published_by
    )

    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    return {
        "message": "Announcement created successfully",
        "id": announcement.id
    }


@router.delete("/announcements/{announcement_id}")
def delete_management_announcement(
    announcement_id: int,
    db: Session = Depends(get_db)
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Announcement not found")

    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully"}


# ============================================================================
# COMPLAINTS (MANAGEMENT REVIEW & AUDIT)
# ============================================================================

@router.get("/complaints")
def get_management_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint).filter(Complaint.is_archived.is_(False))

    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if category_filter:
        query = query.filter(Complaint.category == category_filter)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Complaint.ticket_number).like(s),
                func.lower(Complaint.title).like(s),
                func.lower(Complaint.description).like(s),
            )
        )

    complaints = query.order_by(Complaint.created_at.desc()).all()

    return [
        {
            "id": c.id,
            "ticket_number": c.ticket_number,
            "student_id": c.student_id,
            "student_name": c.student.full_name if c.student else "Student",
            "student_registration": c.student.registration_number if c.student else "",
            "title": c.title,
            "category": c.category,
            "description": c.description,
            "has_evidence": bool(c.evidence_file_path or c.image_url),
            "evidence_url": f"/api/student/complaints/{c.ticket_number}/evidence" if c.evidence_file_path else c.image_url,
            "status": c.status,
            "management_response": c.management_response,
            "created_at": c.created_at.astimezone(IST).isoformat() if c.created_at else None,
            "updated_at": c.updated_at.astimezone(IST).isoformat() if c.updated_at else None,
            "status_history_count": len(c.status_logs)
        }
        for c in complaints
    ]


@router.get("/complaints/{ticket_identifier}")
def get_management_complaint_detail(
    ticket_identifier: str,
    db: Session = Depends(get_db)
):
    # Lookup by ticket_number or integer id
    complaint = None
    if ticket_identifier.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(ticket_identifier)).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.ticket_number == ticket_identifier).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    return {
        "id": complaint.id,
        "ticket_number": complaint.ticket_number,
        "student_id": complaint.student_id,
        "student_name": complaint.student.full_name if complaint.student else "Student",
        "student_registration": complaint.student.registration_number if complaint.student else "",
        "student_phone": complaint.student.phone if complaint.student else None,
        "student_email": complaint.student.email if complaint.student else None,
        "title": complaint.title,
        "category": complaint.category,
        "description": complaint.description,
        "has_evidence": bool(complaint.evidence_file_path or complaint.image_url),
        "evidence_url": f"/api/student/complaints/{complaint.ticket_number}/evidence" if complaint.evidence_file_path else complaint.image_url,
        "status": complaint.status,
        "management_response": complaint.management_response,
        "created_at": complaint.created_at.astimezone(IST).isoformat() if complaint.created_at else None,
        "updated_at": complaint.updated_at.astimezone(IST).isoformat() if complaint.updated_at else None,
        "status_history": [
            {
                "id": log.id,
                "old_status": log.old_status,
                "new_status": log.new_status,
                "notes": log.notes,
                "updated_by_role": log.updated_by_role,
                "created_at": log.created_at.astimezone(IST).isoformat() if log.created_at else None
            }
            for log in complaint.status_logs
        ]
    }


@router.patch("/complaints/{ticket_identifier}")
def update_management_complaint(
    ticket_identifier: str,
    payload: ManagementComplaintResponsePayload,
    current_user=Depends(require_management),
    db: Session = Depends(get_db)
):
    complaint = None
    if ticket_identifier.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(ticket_identifier)).first()
    if not complaint:
        complaint = db.query(Complaint).filter(Complaint.ticket_number == ticket_identifier).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    allowed_statuses = ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"]
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(allowed_statuses)}")

    old_status = complaint.status
    complaint.status = payload.status
    complaint.updated_at = datetime.now(timezone.utc)
    if payload.management_response:
        complaint.management_response = payload.management_response.strip()

    # Immutable audit log entry (ON DELETE RESTRICT protects this chain)
    audit_log = ComplaintStatusLog(
        complaint_id=complaint.id,
        complaint_ticket_number=complaint.ticket_number,
        old_status=old_status,
        new_status=payload.status,
        notes=payload.management_response.strip() if payload.management_response else f"Status changed to {payload.status}.",
        updated_by_role="management",
        updated_by_user_id=current_user.id
    )
    db.add(audit_log)

    # Student update notification
    notif = Notification(
        student_id=complaint.student_id,
        title=f"Complaint Status Update: {complaint.status}",
        message=f"Ticket {complaint.ticket_number} ('{complaint.title}') was updated to '{complaint.status}'." + (
            f" Note: {payload.management_response}" if payload.management_response else ""
        ),
        category="complaint_status",
        priority="important" if payload.status in ["In Progress", "Resolved"] else "normal",
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint updated successfully",
        "ticket_number": complaint.ticket_number,
        "status": complaint.status,
        "management_response": complaint.management_response,
        "updated_at": complaint.updated_at.astimezone(IST).isoformat() if complaint.updated_at else None
    }


# ============================================================================
# DIRECT MESSAGING (MANAGEMENT GROUP & INDIVIDUAL DISPATCH)
# ============================================================================

@router.post("/messages")
def dispatch_management_message(
    payload: ManagementMessageDispatchPayload,
    current_user=Depends(require_management),
    db: Session = Depends(get_db)
):
    target_type = payload.target_type.strip().lower()
    broadcast_uuid = uuid.uuid4().hex
    sender_name = "Campus Transport Office"

    recipients: List[Student] = []

    if target_type == "student":
        target_id_str = str(payload.target_id or "").strip()
        student = None
        if target_id_str.isdigit():
            student = db.query(Student).filter(Student.id == int(target_id_str)).first()
        if not student:
            student = db.query(Student).filter(
                or_(
                    func.lower(Student.registration_number) == target_id_str.lower(),
                    func.lower(Student.email) == target_id_str.lower()
                )
            ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student recipient not found")
        recipients = [student]

    elif target_type == "route":
        route_id_val = int(payload.target_id) if payload.target_id and str(payload.target_id).isdigit() else None
        if not route_id_val:
            raise HTTPException(status_code=400, detail="Valid route_id required for route dispatch")
        
        now = datetime.now(timezone.utc)
        assignments = db.query(StudentRouteAssignment).filter(
            StudentRouteAssignment.route_id == route_id_val,
            StudentRouteAssignment.status == "active",
            StudentRouteAssignment.start_date <= now,
            (
                (StudentRouteAssignment.end_date.is_(None)) |
                (StudentRouteAssignment.end_date > now)
            )
        ).all()
        recipients = [a.student for a in assignments if a.student and a.student.user_id]

    elif target_type == "all_active_students":
        recipients = db.query(Student).join(User, Student.user_id == User.id).filter(User.is_active.is_(True)).all()

    else:
        raise HTTPException(status_code=400, detail="Invalid target_type. Must be 'student', 'route', or 'all_active_students'.")

    if not recipients:
        return {
            "message": "No active recipients matched the criteria.",
            "recipients_count": 0
        }

    # Fan-out on write: insert individual row per recipient
    count = 0
    title_text = payload.title.strip() if payload.title else "Campus Transport Official Notice"
    content_text = payload.content.strip()

    for student in recipients:
        if not student.user_id:
            continue
        msg = DirectMessage(
            broadcast_id=broadcast_uuid if target_type != "student" else None,
            sender_id=current_user.id,
            recipient_id=student.user_id,
            sender_name=sender_name,
            sender_role="management",
            recipient_name=student.full_name,
            recipient_role="student",
            title=title_text,
            content=content_text,
            is_read=False
        )
        db.add(msg)
        count += 1

    db.commit()

    return {
        "message": f"Message dispatched successfully to {count} student(s).",
        "broadcast_id": broadcast_uuid if target_type != "student" else None,
        "recipients_count": count
    }
