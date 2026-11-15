from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
from zoneinfo import ZoneInfo
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, text, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    Student,
    StudentRouteAssignment,
    RouteStop,
    BusAllocation,
    Attendance,
    BusLocation,
    Announcement,
    Complaint,
    ComplaintStatusLog,
    DirectMessage,
    Notification,
    DiscussionMessage,
    User,
)
from app.permissions import require_student


router = APIRouter(
    prefix="/student",
    tags=["Student Dashboard"]
)

OFFICIAL_DEMO_QR_PAYLOAD = "VAHMITRA-SRMAP-DEMO-PASS-2026"
IST = ZoneInfo("Asia/Kolkata")

EVIDENCE_UPLOAD_DIR = Path("/home/joshu/projects/VahMitra_Web/backend/uploads/complaints")
EVIDENCE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

VERIFICATION_METHOD_LABELS = {
    "qr_code": "QR Pass Scan",
    "qr_live": "Live QR Scan",
    "qr_demo": "Demo QR Verification",
    "manual": "Driver Manual Entry",
    "rfid": "Smart Card (RFID)",
    "biometric": "Biometric Terminal",
}


def format_verification_method(val: Optional[str]) -> str:
    if not val:
        return "Verified"
    return VERIFICATION_METHOD_LABELS.get(val.lower(), val.replace("_", " ").title())


def generate_complaint_ticket_number(db: Session) -> str:
    seq_val = db.execute(text("SELECT nextval('complaint_ticket_seq');")).scalar()
    year_val = db.execute(text("SELECT to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY');")).scalar()
    return f"VAH-CMP-{year_val}-{int(seq_val):06d}"


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class ProfileUpdatePayload(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)


class PhotoUpdatePayload(BaseModel):
    photo_data: str  # Data URL or URL


class ComplaintCreatePayload(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., max_length=50)
    description: str = Field(..., min_length=10, max_length=3000)
    image_url: Optional[str] = None


class DirectMessageSendPayload(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=1, max_length=4000)


class DiscussionMessageCreatePayload(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class QrScanPayload(BaseModel):
    qr_payload: str


# ============================================================================
# HELPER: GET CURRENT STUDENT RECORD
# ============================================================================

def get_current_student(current_user, db: Session) -> Student:
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for authenticated user"
        )
    return student


# ============================================================================
# 1. MAIN DASHBOARD OVERVIEW
# ============================================================================

@router.get("/dashboard")
def student_dashboard(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    student = get_current_student(current_user, db)

    assignment = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.student_id == student.id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).order_by(
        StudentRouteAssignment.start_date.desc()
    ).first()

    route_data = None
    bus_data = None
    driver_data = None
    stops_data = []
    location_data = None

    if assignment:
        route = assignment.route

        route_data = {
            "id": route.id,
            "area": route.area,
            "route_code": route.route_code,
            "route_name": route.route_name,
            "start_point": route.start_point,
            "end_point": route.end_point
        }

        stops = db.query(RouteStop).filter(
            RouteStop.route_id == route.id
        ).order_by(
            RouteStop.sequence_number
        ).all()

        stops_data = [
            {
                "id": stop.id,
                "name": stop.stop_name,
                "sequence_number": stop.sequence_number,
                "latitude": stop.latitude,
                "longitude": stop.longitude
            }
            for stop in stops
        ]

        allocation = db.query(BusAllocation).filter(
            BusAllocation.route_id == route.id,
            BusAllocation.status == "active",
            BusAllocation.start_date <= now,
            (
                (BusAllocation.end_date.is_(None)) |
                (BusAllocation.end_date > now)
            )
        ).order_by(
            BusAllocation.start_date.desc()
        ).first()

        if allocation:
            bus = allocation.bus
            driver = allocation.driver

            bus_data = {
                "id": bus.id,
                "bus_number": bus.bus_number,
                "registration_number": bus.registration_number,
                "capacity": bus.capacity
            }

            driver_data = {
                "id": driver.id,
                "name": driver.driver_name,
                "phone": driver.phone
            }

            location = db.query(BusLocation).filter(
                BusLocation.bus_id == bus.id
            ).order_by(
                BusLocation.recorded_at.desc()
            ).first()

            if location:
                location_data = {
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "recorded_at": location.recorded_at.isoformat()
                }

    # Attendance
    attendance_query = db.query(Attendance).filter(
        Attendance.student_id == student.id
    )
    attendance_total = attendance_query.count()
    recent_attendance = attendance_query.order_by(
        Attendance.boarding_time.desc()
    ).limit(10).all()

    attendance_data = [
        {
            "id": record.id,
            "boarding_time": record.boarding_time.isoformat() if record.boarding_time else None,
            "verification_method": record.verification_method,
            "allocation_id": record.bus_allocation_id
        }
        for record in recent_attendance
    ]

    # Announcements (pinned first, then latest)
    route_id = route_data["id"] if route_data else None
    announcements_query = db.query(Announcement).filter(
        (Announcement.route_id.is_(None)) | (Announcement.route_id == route_id)
    ).order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).limit(6).all()

    announcements_data = [
        {
            "id": ann.id,
            "title": ann.title,
            "description": ann.description,
            "category": ann.category,
            "priority": ann.priority,
            "is_pinned": ann.is_pinned,
            "published_by": ann.published_by,
            "created_at": ann.created_at.isoformat() if ann.created_at else None
        }
        for ann in announcements_query
    ]

    # Notifications preview & count
    unread_count = db.query(Notification).filter(
        Notification.student_id == student.id,
        Notification.is_read.is_(False)
    ).count()

    recent_notifications = db.query(Notification).filter(
        Notification.student_id == student.id
    ).order_by(
        Notification.created_at.desc()
    ).limit(5).all()

    notifications_data = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "priority": n.priority,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in recent_notifications
    ]

    # Direct messages unread count & preview
    unread_messages_count = db.query(DirectMessage).filter(
        DirectMessage.recipient_id == current_user.id,
        DirectMessage.is_read.is_(False),
        DirectMessage.is_deleted_by_recipient.is_(False)
    ).count()

    latest_message = db.query(DirectMessage).filter(
        DirectMessage.recipient_id == current_user.id,
        DirectMessage.is_deleted_by_recipient.is_(False)
    ).order_by(
        DirectMessage.created_at.desc()
    ).first()

    # Open complaints count
    open_complaints_count = db.query(Complaint).filter(
        Complaint.student_id == student.id,
        Complaint.status.in_(["Submitted", "Under Review", "In Progress"]),
        Complaint.is_archived.is_(False)
    ).count()

    latest_complaint = db.query(Complaint).filter(
        Complaint.student_id == student.id,
        Complaint.is_archived.is_(False)
    ).order_by(
        Complaint.created_at.desc()
    ).first()

    # Distinct attendance days strictly in Asia/Kolkata
    distinct_attendance_days = db.query(
        func.count(func.distinct(func.date(func.timezone('Asia/Kolkata', Attendance.boarding_time))))
    ).filter(
        Attendance.student_id == student.id
    ).scalar() or 0

    return {
        "student": {
            "id": student.id,
            "registration_number": student.registration_number,
            "full_name": student.full_name,
            "nickname": student.nickname,
            "email": student.email,
            "phone": student.phone,
            "profile_photo_url": student.profile_photo_url,
            "department": student.department or "School of Engineering & Applied Sciences",
            "academic_year": student.academic_year or "AY 2025-2026"
        },
        "assignment": {
            "id": assignment.id,
            "start_date": assignment.start_date.isoformat() if assignment.start_date else None,
            "end_date": assignment.end_date.isoformat() if assignment.end_date else None
        } if assignment else None,
        "route": route_data,
        "stops": stops_data,
        "bus": bus_data,
        "driver": driver_data,
        "location": location_data,
        "attendance": {
            "total": attendance_total,
            "distinct_days": distinct_attendance_days,
            "recent": attendance_data
        },
        "announcements": announcements_data,
        "unread_notifications_count": unread_count,
        "notifications_preview": notifications_data,
        "unread_messages_count": unread_messages_count,
        "open_complaints_count": open_complaints_count,
        "latest_message_preview": {
            "id": latest_message.id,
            "sender_name": latest_message.sender_name,
            "sender_role": latest_message.sender_role,
            "title": latest_message.title,
            "snippet": latest_message.content[:80] + ("..." if len(latest_message.content) > 80 else ""),
            "created_at": latest_message.created_at.astimezone(IST).isoformat() if latest_message.created_at else None
        } if latest_message else None,
        "latest_complaint_preview": {
            "id": latest_complaint.id,
            "ticket_number": latest_complaint.ticket_number,
            "title": latest_complaint.title,
            "status": latest_complaint.status,
            "created_at": latest_complaint.created_at.astimezone(IST).isoformat() if latest_complaint.created_at else None
        } if latest_complaint else None
    }


# ============================================================================
# 2. ANNOUNCEMENTS
# ============================================================================

@router.get("/announcements")
def get_student_announcements(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    # Find active route
    now = datetime.now(timezone.utc)
    assignment = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.student_id == student.id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).first()

    route_id = assignment.route_id if assignment else None

    announcements = db.query(Announcement).filter(
        (Announcement.route_id.is_(None)) | (Announcement.route_id == route_id)
    ).order_by(
        Announcement.is_pinned.desc(),
        Announcement.created_at.desc()
    ).all()

    return [
        {
            "id": ann.id,
            "title": ann.title,
            "description": ann.description,
            "category": ann.category,
            "priority": ann.priority,
            "is_pinned": ann.is_pinned,
            "published_by": ann.published_by,
            "created_at": ann.created_at.isoformat() if ann.created_at else None
        }
        for ann in announcements
    ]


# ============================================================================
# 3. NOTIFICATIONS
# ============================================================================

@router.get("/notifications")
def get_student_notifications(
    category_filter: Optional[str] = Query(None, alias="filter"),
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    query = db.query(Notification).filter(Notification.student_id == student.id)

    if category_filter == "unread":
        query = query.filter(Notification.is_read.is_(False))
    elif category_filter == "read":
        query = query.filter(Notification.is_read.is_(True))
    elif category_filter in ["important", "emergency"]:
        query = query.filter(Notification.priority == category_filter)

    notifications = query.order_by(Notification.created_at.desc()).all()

    unread_count = db.query(Notification).filter(
        Notification.student_id == student.id,
        Notification.is_read.is_(False)
    ).count()

    return {
        "unread_count": unread_count,
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "category": n.category,
                "priority": n.priority,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifications
        ]
    }


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.student_id == student.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}


@router.patch("/notifications/read-all")
def mark_all_notifications_read(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    db.query(Notification).filter(
        Notification.student_id == student.id,
        Notification.is_read.is_(False)
    ).update({"is_read": True}, synchronize_session=False)

    db.commit()

    return {"message": "All notifications marked as read"}


# ============================================================================
# 4. COMPLAINTS & SUPPORT (TICKET SYSTEM)
# ============================================================================

@router.get("/complaints")
def get_student_complaints(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    complaints = db.query(Complaint).filter(
        Complaint.student_id == student.id,
        Complaint.is_archived.is_(False)
    ).order_by(
        Complaint.created_at.desc()
    ).all()

    return [
        {
            "id": c.id,
            "ticket_number": c.ticket_number,
            "title": c.title,
            "category": c.category,
            "description": c.description,
            "has_evidence": bool(c.evidence_file_path or c.image_url),
            "evidence_url": f"/api/student/complaints/{c.ticket_number}/evidence" if c.evidence_file_path else c.image_url,
            "status": c.status,
            "management_response": c.management_response,
            "created_at": c.created_at.astimezone(IST).isoformat() if c.created_at else None,
            "updated_at": c.updated_at.astimezone(IST).isoformat() if c.updated_at else None,
            "status_history": [
                {
                    "id": log.id,
                    "old_status": log.old_status,
                    "new_status": log.new_status,
                    "notes": log.notes,
                    "updated_by_role": log.updated_by_role,
                    "created_at": log.created_at.astimezone(IST).isoformat() if log.created_at else None
                }
                for log in c.status_logs
            ]
        }
        for c in complaints
    ]


@router.post("/complaints")
async def submit_student_complaint(
    request: Request,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)
    content_type = request.headers.get("content-type", "")

    title = ""
    category = "Other"
    description = ""
    evidence_file_path = None
    image_url = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        title = str(form.get("title", "")).strip()
        category = str(form.get("category", "Other")).strip()
        description = str(form.get("description", "")).strip()

        file_obj = form.get("evidence_file") or form.get("evidence") or form.get("file")
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            ext = Path(file_obj.filename).suffix.lower()
            if ext not in ALLOWED_IMAGE_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
                )
            file_bytes = await file_obj.read()
            if len(file_bytes) > MAX_IMAGE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Evidence image exceeds maximum allowed size of 5 MB."
                )
            if len(file_bytes) > 0:
                safe_filename = f"{uuid.uuid4().hex}{ext}"
                target_path = EVIDENCE_UPLOAD_DIR / safe_filename
                with open(target_path, "wb") as f:
                    f.write(file_bytes)
                evidence_file_path = str(target_path)
    else:
        body = await request.json()
        title = str(body.get("title", "")).strip()
        category = str(body.get("category", "Other")).strip()
        description = str(body.get("description", "")).strip()
        image_url = body.get("image_url")

    if not title or len(title) < 3:
        raise HTTPException(status_code=400, detail="Title must be at least 3 characters.")
    if not description or len(description) < 10:
        raise HTTPException(status_code=400, detail="Description must be at least 10 characters.")

    # Concurrency-safe ticket number generation
    ticket_number = generate_complaint_ticket_number(db)

    complaint = Complaint(
        ticket_number=ticket_number,
        student_id=student.id,
        title=title,
        category=category,
        description=description,
        evidence_file_path=evidence_file_path,
        image_url=image_url,
        status="Submitted"
    )
    db.add(complaint)
    db.flush()

    # Immutable initial status audit log
    status_log = ComplaintStatusLog(
        complaint_id=complaint.id,
        complaint_ticket_number=ticket_number,
        old_status=None,
        new_status="Submitted",
        notes="Support ticket logged by student.",
        updated_by_role="student",
        updated_by_user_id=current_user.id
    )
    db.add(status_log)

    # Student confirmation notification
    db.add(Notification(
        student_id=student.id,
        title="Support Ticket Logged",
        message=f"Ticket {ticket_number} ('{complaint.title}') registered successfully. Campus Transport will review it shortly.",
        category="complaint_status",
        priority="normal",
        is_read=False
    ))

    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint submitted successfully",
        "ticket_number": complaint.ticket_number,
        "complaint_id": complaint.id,
        "status": complaint.status,
        "created_at": complaint.created_at.astimezone(IST).isoformat() if complaint.created_at else None
    }


@router.get("/complaints/{ticket_number}")
def get_student_complaint_detail(
    ticket_number: str,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)
    complaint = db.query(Complaint).filter(
        Complaint.ticket_number == ticket_number,
        Complaint.student_id == student.id
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    return {
        "id": complaint.id,
        "ticket_number": complaint.ticket_number,
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


@router.get("/complaints/{ticket_number}/evidence")
def get_complaint_evidence(
    ticket_number: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.ticket_number == ticket_number).first()
    if not complaint or not complaint.evidence_file_path:
        raise HTTPException(status_code=404, detail="Evidence file not found")

    # Access control: only owning student or management user
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student or student.id != complaint.student_id:
            raise HTTPException(status_code=403, detail="Unauthorized to view this evidence")
    elif current_user.role != "management":
        raise HTTPException(status_code=403, detail="Unauthorized to view this evidence")

    file_path = Path(complaint.evidence_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Evidence file missing on server")

    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    media_type = media_types.get(file_path.suffix.lower(), "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=f"evidence_{ticket_number}{file_path.suffix.lower()}",
        headers={"X-Content-Type-Options": "nosniff"}
    )


# ============================================================================
# 5. MY BUS MEMBERS
# ============================================================================

@router.get("/bus-members")
def get_bus_members(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    student = get_current_student(current_user, db)

    # Find student's active route assignment
    assignment = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.student_id == student.id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).first()

    if not assignment:
        return {
            "has_route": False,
            "route_code": None,
            "members": []
        }

    # Retrieve all students on this route
    route_assignments = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.route_id == assignment.route_id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).all()

    members = []
    for ra in route_assignments:
        s = ra.student
        members.append({
            "id": s.id,
            "registration_number": s.registration_number,
            "full_name": s.full_name,
            "nickname": s.nickname,
            "profile_photo_url": s.profile_photo_url,
            "department": s.department or "Engineering",
            "is_current_user": s.id == student.id
        })

    return {
        "has_route": True,
        "route_code": assignment.route.route_code,
        "route_name": assignment.route.route_name,
        "total_members": len(members),
        "members": members
    }


# ============================================================================
# 6. DISCUSSION ROOM
# ============================================================================

@router.get("/discussion")
def get_discussion_messages(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    student = get_current_student(current_user, db)

    # Route-aware discussion
    assignment = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.student_id == student.id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).first()

    route_id = assignment.route_id if assignment else None

    messages = db.query(DiscussionMessage).filter(
        (DiscussionMessage.route_id.is_(None)) | (DiscussionMessage.route_id == route_id),
        DiscussionMessage.is_deleted.is_(False)
    ).order_by(
        DiscussionMessage.created_at.asc()
    ).limit(100).all()

    return [
        {
            "id": msg.id,
            "sender_name": msg.student.nickname or msg.student.full_name,
            "official_name": msg.student.full_name,
            "registration_number": msg.student.registration_number,
            "sender_avatar": msg.student.profile_photo_url,
            "content": msg.content,
            "is_own": msg.student_id == student.id,
            "created_at": msg.created_at.isoformat() if msg.created_at else None
        }
        for msg in messages
    ]


@router.post("/discussion")
def post_discussion_message(
    payload: DiscussionMessageCreatePayload,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    student = get_current_student(current_user, db)

    assignment = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.student_id == student.id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).first()

    route_id = assignment.route_id if assignment else None

    msg = DiscussionMessage(
        student_id=student.id,
        route_id=route_id,
        content=payload.content.strip()
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "sender_name": student.nickname or student.full_name,
        "content": msg.content,
        "created_at": msg.created_at.isoformat()
    }


@router.delete("/discussion/{message_id}")
def delete_discussion_message(
    message_id: int,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    msg = db.query(DiscussionMessage).filter(
        DiscussionMessage.id == message_id,
        DiscussionMessage.student_id == student.id
    ).first()

    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or unauthorized to delete"
        )

    msg.is_deleted = True
    db.commit()

    return {"message": "Message removed successfully"}


@router.post("/discussion/{message_id}/report")
def report_discussion_message(
    message_id: int,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    get_current_student(current_user, db)

    msg = db.query(DiscussionMessage).filter(
        DiscussionMessage.id == message_id
    ).first()

    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    msg.is_reported = True
    db.commit()

    return {"message": "Message reported to moderation team"}


# ============================================================================
# 7. PROFILE CUSTOMIZATION (NICKNAME & PHOTO)
# ============================================================================

@router.patch("/profile")
def update_student_profile(
    payload: ProfileUpdatePayload,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    if payload.nickname is not None:
        student.nickname = payload.nickname.strip() or None

    if payload.phone is not None:
        student.phone = payload.phone.strip() or None

    db.commit()
    db.refresh(student)

    return {
        "message": "Profile updated successfully",
        "nickname": student.nickname,
        "phone": student.phone
    }


@router.post("/profile/photo")
def update_profile_photo(
    payload: PhotoUpdatePayload,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    # Basic data URL format validation (e.g. data:image/png;base64,... or https://...)
    photo_str = payload.photo_data.strip()
    if not (photo_str.startswith("data:image/") or photo_str.startswith("http://") or photo_str.startswith("https://") or photo_str.startswith("/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Supported formats: JPG, JPEG, PNG data URLs."
        )

    student.profile_photo_url = photo_str
    db.commit()

    return {
        "message": "Profile photo updated successfully",
        "profile_photo_url": student.profile_photo_url
    }


@router.delete("/profile/photo")
def remove_profile_photo(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    student.profile_photo_url = None
    db.commit()

    return {"message": "Profile photo removed successfully"}


# ============================================================================
# 8. DIRECT MESSAGES (MANAGEMENT & ROUTE-LEVEL DRIVER COMMUNICATION)
# ============================================================================

@router.get("/messages")
def get_student_messages(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    messages = db.query(DirectMessage).filter(
        DirectMessage.recipient_id == current_user.id,
        DirectMessage.is_deleted_by_recipient.is_(False)
    ).order_by(
        DirectMessage.created_at.desc()
    ).all()

    unread_count = sum(1 for m in messages if not m.is_read)

    return {
        "unread_count": unread_count,
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "sender_name": m.sender_name,
                "sender_role": m.sender_role,
                "title": m.title or "Campus Transit Message",
                "content": m.content,
                "preview": m.content[:120] + ("..." if len(m.content) > 120 else ""),
                "is_read": m.is_read,
                "read_at": m.read_at.astimezone(IST).isoformat() if m.read_at else None,
                "created_at": m.created_at.astimezone(IST).isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }


@router.get("/messages/{message_id}")
def get_student_message_detail(
    message_id: int,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    m = db.query(DirectMessage).filter(
        DirectMessage.id == message_id,
        DirectMessage.recipient_id == current_user.id,
        DirectMessage.is_deleted_by_recipient.is_(False)
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="Message not found")

    if not m.is_read:
        m.is_read = True
        m.read_at = datetime.now(timezone.utc)
        db.commit()

    return {
        "id": m.id,
        "sender_name": m.sender_name,
        "sender_role": m.sender_role,
        "title": m.title or "Campus Transit Message",
        "content": m.content,
        "is_read": m.is_read,
        "read_at": m.read_at.astimezone(IST).isoformat() if m.read_at else None,
        "created_at": m.created_at.astimezone(IST).isoformat() if m.created_at else None
    }


@router.patch("/messages/{message_id}/read")
def mark_message_as_read(
    message_id: int,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    m = db.query(DirectMessage).filter(
        DirectMessage.id == message_id,
        DirectMessage.recipient_id == current_user.id,
        DirectMessage.is_deleted_by_recipient.is_(False)
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="Message not found")

    m.is_read = True
    m.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Message marked as read", "message_id": message_id}


@router.patch("/messages/read-all")
def mark_all_messages_as_read(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    now_utc = datetime.now(timezone.utc)
    updated = db.query(DirectMessage).filter(
        DirectMessage.recipient_id == current_user.id,
        DirectMessage.is_read.is_(False),
        DirectMessage.is_deleted_by_recipient.is_(False)
    ).update(
        {"is_read": True, "read_at": now_utc},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Marked {updated} messages as read"}


@router.delete("/messages/{message_id}")
def delete_student_message(
    message_id: int,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    m = db.query(DirectMessage).filter(
        DirectMessage.id == message_id,
        DirectMessage.recipient_id == current_user.id
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="Message not found")

    m.is_deleted_by_recipient = True
    db.commit()
    return {"message": "Message deleted from inbox"}


# ============================================================================
# 9. ATTENDANCE HISTORY (REAL DATABASE RECORDS ONLY & ASIA/KOLKATA TIMEZONE)
# ============================================================================

@router.get("/attendance")
def get_student_attendance_history(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    query = db.query(Attendance).filter(Attendance.student_id == student.id)

    # Date filters strictly in Asia/Kolkata timezone
    if month is not None:
        query = query.filter(func.extract('month', func.timezone('Asia/Kolkata', Attendance.boarding_time)) == month)
    if year is not None:
        query = query.filter(func.extract('year', func.timezone('Asia/Kolkata', Attendance.boarding_time)) == year)

    if start_date:
        try:
            s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(func.date(func.timezone('Asia/Kolkata', Attendance.boarding_time)) >= s_date)
        except ValueError:
            pass

    if end_date:
        try:
            e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(func.date(func.timezone('Asia/Kolkata', Attendance.boarding_time)) <= e_date)
        except ValueError:
            pass

    total = query.count()

    records = query.order_by(
        Attendance.boarding_time.desc()
    ).offset((page - 1) * limit).limit(limit).all()

    items = []
    for r in records:
        ist_time = r.boarding_time.astimezone(IST) if r.boarding_time else None
        allocation = r.bus_allocation
        bus_number = allocation.bus.bus_number if allocation and allocation.bus else "Bus"
        reg_number = allocation.bus.registration_number if allocation and allocation.bus else ""
        route_code = allocation.route.route_code if allocation and allocation.route else "Route"
        route_name = allocation.route.route_name if allocation and allocation.route else ""
        driver_name = allocation.driver.driver_name if allocation and allocation.driver else "Assigned Driver"

        items.append({
            "id": r.id,
            "boarding_time": r.boarding_time.isoformat() if r.boarding_time else None,
            "date": ist_time.strftime("%d %b %Y") if ist_time else "",
            "time": ist_time.strftime("%I:%M %p") if ist_time else "",
            "month_label": ist_time.strftime("%B %Y") if ist_time else "",
            "bus_number": bus_number,
            "bus_registration": reg_number,
            "route_code": route_code,
            "route_name": route_name,
            "driver_name": driver_name,
            "verification_method_raw": r.verification_method,
            "verification_method": format_verification_method(r.verification_method),
            "status": "Verified Boarding"
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
        "records": items
    }


@router.get("/attendance/summary")
def get_student_attendance_summary(
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    student = get_current_student(current_user, db)

    total_boardings = db.query(Attendance).filter(Attendance.student_id == student.id).count()

    distinct_days = db.query(
        func.count(func.distinct(func.date(func.timezone('Asia/Kolkata', Attendance.boarding_time))))
    ).filter(
        Attendance.student_id == student.id
    ).scalar() or 0

    latest_record = db.query(Attendance).filter(
        Attendance.student_id == student.id
    ).order_by(
        Attendance.boarding_time.desc()
    ).first()

    latest_ist = latest_record.boarding_time.astimezone(IST) if latest_record and latest_record.boarding_time else None

    # Group by month strictly in Asia/Kolkata
    monthly_rows = db.query(
        func.to_char(func.timezone('Asia/Kolkata', Attendance.boarding_time), 'YYYY-MM').label('month_key'),
        func.to_char(func.timezone('Asia/Kolkata', Attendance.boarding_time), 'FMMonth YYYY').label('month_label'),
        func.count().label('boardings_count'),
        func.count(func.distinct(func.date(func.timezone('Asia/Kolkata', Attendance.boarding_time)))).label('distinct_days_count')
    ).filter(
        Attendance.student_id == student.id
    ).group_by(
        text("1"), text("2")
    ).order_by(
        text("1 DESC")
    ).all()

    monthly_history = [
        {
            "month_key": row.month_key,
            "month_label": row.month_label,
            "boardings": row.boardings_count,
            "distinct_days": row.distinct_days_count
        }
        for row in monthly_rows
    ]

    return {
        "has_records": total_boardings > 0,
        "total_boardings": total_boardings,
        "distinct_attendance_days": distinct_days,
        "most_recent_boarding": {
            "iso": latest_record.boarding_time.isoformat() if latest_record and latest_record.boarding_time else None,
            "formatted_date": latest_ist.strftime("%d %b %Y") if latest_ist else None,
            "formatted_time": latest_ist.strftime("%I:%M %p") if latest_ist else None,
            "bus_number": latest_record.bus_allocation.bus.bus_number if latest_record and latest_record.bus_allocation and latest_record.bus_allocation.bus else None,
            "route_code": latest_record.bus_allocation.route.route_code if latest_record and latest_record.bus_allocation and latest_record.bus_allocation.route else None
        } if latest_record else None,
        "monthly_history": monthly_history
    }


# ============================================================================
# 10. QR ATTENDANCE SCANNER: OFFICIAL DEMO & REAL ARCHITECTURE
# ============================================================================

@router.post("/attendance/scan-demo")
def scan_demo_qr(
    payload: QrScanPayload,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    get_current_student(current_user, db)

    raw_qr = payload.qr_payload.strip()

    # The requirement: One official, stable VAHMITRA demo QR
    if raw_qr == OFFICIAL_DEMO_QR_PAYLOAD or raw_qr == "VAHMITRA-DEMO":
        return {
            "valid": True,
            "type": "demo",
            "title": "Welcome to VAHMITRA!",
            "subtitle": "Demo QR Scan Successful",
            "notice": "Demonstration Mode — No Attendance Recorded",
            "scanned_at": datetime.now(timezone.utc).isoformat()
        }

    return {
        "valid": False,
        "type": "invalid",
        "title": "Unrecognized QR Code",
        "detail": "This QR code is not recognized by the VAHMITRA campus transit system. Please scan the official VAHMITRA demo QR code."
    }


@router.post("/attendance/scan-live")
def scan_live_attendance(
    payload: QrScanPayload,
    current_user=Depends(require_student),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    student = get_current_student(current_user, db)

    # 1. Reject if payload is demo QR
    if payload.qr_payload == OFFICIAL_DEMO_QR_PAYLOAD or payload.qr_payload == "VAHMITRA-DEMO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Demo QR code cannot be recorded as real student attendance."
        )

    # 2. Check student has an active route assignment
    assignment = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.student_id == student.id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active route assignment found for this student account."
        )

    # 3. Check route has an active bus allocation
    allocation = db.query(BusAllocation).filter(
        BusAllocation.route_id == assignment.route_id,
        BusAllocation.status == "active",
        BusAllocation.start_date <= now,
        (
            (BusAllocation.end_date.is_(None)) |
            (BusAllocation.end_date > now)
        )
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active bus allocation found for this route."
        )

    # 4. Duplicate prevention within 60 minutes
    recent_attendance = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.bus_allocation_id == allocation.id
    ).order_by(Attendance.boarding_time.desc()).first()

    if recent_attendance and (now - recent_attendance.boarding_time).total_seconds() < 3600:
        return {
            "status": "already_recorded",
            "message": "Boarding attendance already recorded for this trip.",
            "record_id": recent_attendance.id,
            "boarding_time": recent_attendance.boarding_time.isoformat()
        }

    # 5. Record attendance
    attendance_record = Attendance(
        student_id=student.id,
        bus_allocation_id=allocation.id,
        verification_method="qr_code"
    )

    db.add(attendance_record)

    # Notification
    db.add(Notification(
        student_id=student.id,
        title="Boarding Verified",
        message=f"Attendance confirmed on Bus #{allocation.bus.bus_number} ({allocation.route.route_code}) via secure QR scan.",
        category="attendance",
        priority="normal",
        is_read=False
    ))

    db.commit()
    db.refresh(attendance_record)

    return {
        "status": "confirmed",
        "message": "Attendance successfully verified and recorded.",
        "record_id": attendance_record.id,
        "bus_number": allocation.bus.bus_number,
        "route_code": allocation.route.route_code,
        "boarding_time": attendance_record.boarding_time.isoformat()
    }
