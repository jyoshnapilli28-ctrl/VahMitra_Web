from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Driver,
    BusAllocation,
    RouteStop,
    StudentRouteAssignment,
    Attendance,
    BusLocation,
    DirectMessage,
)
from app.permissions import require_driver

IST = ZoneInfo("Asia/Kolkata")


class DriverMessagePayload(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=1, max_length=4000)


router = APIRouter(
    prefix="/driver",
    tags=["Driver Dashboard"]
)


@router.get("/dashboard")
def driver_dashboard(
    current_user=Depends(require_driver),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    driver = db.query(Driver).filter(
        Driver.user_id == current_user.id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found"
        )

    allocation = db.query(BusAllocation).filter(
        BusAllocation.driver_id == driver.id,
        BusAllocation.status == "active",
        BusAllocation.start_date <= now,
        (
            (BusAllocation.end_date.is_(None)) |
            (BusAllocation.end_date > now)
        )
    ).order_by(
        BusAllocation.start_date.desc()
    ).first()

    allocation_data = None
    bus_data = None
    route_data = None
    stops_data = []
    students_data = []
    attendance_data = {
        "total": 0,
        "recent": []
    }
    location_data = None

    if allocation:
        bus = allocation.bus
        route = allocation.route

        allocation_data = {
            "id": allocation.id,
            "start_date": allocation.start_date,
            "end_date": allocation.end_date,
            "status": allocation.status
        }

        bus_data = {
            "id": bus.id,
            "bus_number": bus.bus_number,
            "registration_number": bus.registration_number,
            "capacity": bus.capacity,
            "is_active": bus.is_active
        }

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

        assignments = db.query(StudentRouteAssignment).filter(
            StudentRouteAssignment.route_id == route.id,
            StudentRouteAssignment.status == "active",
            StudentRouteAssignment.start_date <= now,
            (
                (StudentRouteAssignment.end_date.is_(None)) |
                (StudentRouteAssignment.end_date > now)
            )
        ).all()

        students_data = [
            {
                "id": assignment.student.id,
                "registration_number": assignment.student.registration_number,
                "full_name": assignment.student.full_name,
                "phone": assignment.student.phone
            }
            for assignment in assignments
        ]

        attendance_query = db.query(Attendance).filter(
            Attendance.bus_allocation_id == allocation.id
        )

        attendance_total = attendance_query.count()

        recent_attendance = attendance_query.order_by(
            Attendance.boarding_time.desc()
        ).limit(10).all()

        attendance_data = {
            "total": attendance_total,
            "recent": [
                {
                    "id": record.id,
                    "student_id": record.student.id,
                    "student_name": record.student.full_name,
                    "registration_number": record.student.registration_number,
                    "boarding_time": record.boarding_time,
                    "verification_method": record.verification_method
                }
                for record in recent_attendance
            ]
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
                "recorded_at": location.recorded_at
            }

    return {
        "driver": {
            "id": driver.id,
            "name": driver.driver_name,
            "phone": driver.phone,
            "license_number": driver.license_number
        },
        "allocation": allocation_data,
        "bus": bus_data,
        "route": route_data,
        "stops": stops_data,
        "students": {
            "total": len(students_data),
            "list": students_data
        },
        "attendance": attendance_data,
        "location": location_data
    }


# ============================================================================
# DRIVER ROUTE-LEVEL MESSAGING
# ============================================================================

@router.post("/messages")
def dispatch_driver_route_message(
    payload: DriverMessagePayload,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    # Authorize driver's active allocation
    allocation = db.query(BusAllocation).filter(
        BusAllocation.driver_id == driver.id,
        BusAllocation.status == "active",
        BusAllocation.start_date <= now,
        (
            (BusAllocation.end_date.is_(None)) |
            (BusAllocation.end_date > now)
        )
    ).order_by(BusAllocation.start_date.desc()).first()

    if not allocation or not allocation.route:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver does not have an active route allocation. Messages can only be sent to students on an actively assigned route."
        )

    # Strictly route-level scope: students actively assigned to this route
    assignments = db.query(StudentRouteAssignment).filter(
        StudentRouteAssignment.route_id == allocation.route_id,
        StudentRouteAssignment.status == "active",
        StudentRouteAssignment.start_date <= now,
        (
            (StudentRouteAssignment.end_date.is_(None)) |
            (StudentRouteAssignment.end_date > now)
        )
    ).all()

    recipients = [a.student for a in assignments if a.student and a.student.user_id]
    if not recipients:
        return {
            "message": "No active students found on your assigned route.",
            "recipients_count": 0,
            "route_code": allocation.route.route_code
        }

    broadcast_uuid = uuid.uuid4().hex
    sender_display_name = f"Driver {driver.driver_name} (Route {allocation.route.route_code})"
    title_text = payload.title.strip() if payload.title else f"Route {allocation.route.route_code} Driver Notice"
    content_text = payload.content.strip()

    count = 0
    for student in recipients:
        msg = DirectMessage(
            broadcast_id=broadcast_uuid,
            sender_id=current_user.id,
            recipient_id=student.user_id,
            sender_name=sender_display_name,
            sender_role="driver",
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
        "message": f"Route announcement sent to {count} student(s) on Route {allocation.route.route_code}.",
        "route_code": allocation.route.route_code,
        "recipients_count": count,
        "broadcast_id": broadcast_uuid
    }


@router.get("/messages")
def get_driver_sent_messages(
    current_user=Depends(require_driver),
    db: Session = Depends(get_db)
):
    messages = db.query(DirectMessage).filter(
        DirectMessage.sender_id == current_user.id
    ).order_by(
        DirectMessage.created_at.desc()
    ).all()

    return [
        {
            "id": m.id,
            "broadcast_id": m.broadcast_id,
            "title": m.title,
            "content": m.content,
            "recipient_name": m.recipient_name,
            "is_read": m.is_read,
            "created_at": m.created_at.astimezone(IST).isoformat() if m.created_at else None
        }
        for m in messages
    ]
