"""
Driver Portal — extended FastAPI router.
Prefix: /driver   Tags: Driver Portal

Does NOT duplicate routes already in driver_dashboard.py:
  GET  /driver/dashboard
  GET  /driver/messages
  POST /driver/messages
"""

import os
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import func as sqlfunc, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Attendance,
    BusAllocation,
    BusLocation,
    DirectMessage,
    Driver,
    DriverNotification,
    FuelRecord,
    Notification,
    RouteStop,
    ServiceRecord,
    StudentRouteAssignment,
    Trip,
    VehicleIssueReport,
)
from app.permissions import require_driver

IST = ZoneInfo("Asia/Kolkata")

router = APIRouter(prefix="/driver", tags=["Driver Portal"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_driver(current_user, db: Session) -> Driver:
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return driver


def _get_active_allocation(driver: Driver, db: Session) -> Optional[BusAllocation]:
    now = datetime.now(timezone.utc)
    return (
        db.query(BusAllocation)
        .filter(
            BusAllocation.driver_id == driver.id,
            BusAllocation.status == "active",
            BusAllocation.start_date <= now,
            (
                BusAllocation.end_date.is_(None)
                | (BusAllocation.end_date > now)
            ),
        )
        .order_by(BusAllocation.start_date.desc())
        .first()
    )


def _notify_route_students(
    allocation: BusAllocation,
    db: Session,
    title: str,
    message: str,
    category: str = "trip",
    priority: str = "normal",
) -> None:
    now = datetime.now(timezone.utc)
    assignments = (
        db.query(StudentRouteAssignment)
        .filter(
            StudentRouteAssignment.route_id == allocation.route_id,
            StudentRouteAssignment.status == "active",
            StudentRouteAssignment.start_date <= now,
            (
                StudentRouteAssignment.end_date.is_(None)
                | (StudentRouteAssignment.end_date > now)
            ),
        )
        .all()
    )
    for assignment in assignments:
        student = assignment.student
        if not student:
            continue
        db.add(
            Notification(
                student_id=student.id,
                title=title,
                message=message,
                category=category,
                priority=priority,
                is_read=False,
            )
        )


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TripStartBody(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None


class TripStopBody(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: Optional[str] = None


class LocationBody(BaseModel):
    latitude: float
    longitude: float


class DriverProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    experience_years: Optional[int] = None


class FuelRecordBody(BaseModel):
    fuel_litres: float
    amount_paid: float
    odometer_km: Optional[float] = None
    fuel_station: Optional[str] = None
    notes: Optional[str] = None
    recorded_at: Optional[str] = None  # ISO datetime string


class ServiceRecordBody(BaseModel):
    service_date: str  # ISO datetime string
    category: str
    description: str
    odometer_km: Optional[float] = None
    service_centre: Optional[str] = None
    cost: Optional[float] = None
    next_service_date: Optional[str] = None
    next_service_km: Optional[float] = None


class VehicleReportBody(BaseModel):
    title: str
    category: str
    description: str
    severity: str = "medium"
    trip_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ---------------------------------------------------------------------------
# A. TRIPS
# ---------------------------------------------------------------------------

@router.post("/trips/start")
def start_trip(
    body: TripStartBody,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)
    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active allocation found for this driver",
        )

    # Check no active trip already
    existing = (
        db.query(Trip)
        .filter(Trip.driver_id == driver.id, Trip.status == "active")
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver already has an active trip (id={existing.id})",
        )

    trip = Trip(
        allocation_id=allocation.id,
        driver_id=driver.id,
        route_id=allocation.route_id,
        bus_id=allocation.bus_id,
        status="active",
        start_lat=body.lat,
        start_lng=body.lng,
        notes=body.notes,
    )
    db.add(trip)
    db.flush()  # get trip.id before commit

    now_ist = datetime.now(IST)
    time_str = now_ist.strftime("%d %b %Y %H:%M IST")

    # Driver notification
    db.add(
        DriverNotification(
            driver_id=driver.id,
            title="Trip Started",
            message=f"Your journey started at {time_str}",
            category="trip",
            priority="normal",
            is_read=False,
        )
    )

    # Route-level student notifications
    bus_number = allocation.bus.bus_number if allocation.bus else "?"
    route_code = allocation.route.route_code if allocation.route else "?"
    _notify_route_students(
        allocation,
        db,
        title="Bus Journey Started",
        message=f"Your bus #{bus_number} (Route {route_code}) has started. [Route-Level Notice]",
        category="trip",
        priority="normal",
    )

    db.commit()
    db.refresh(trip)

    return {
        "id": trip.id,
        "allocation_id": trip.allocation_id,
        "driver_id": trip.driver_id,
        "route_id": trip.route_id,
        "bus_id": trip.bus_id,
        "status": trip.status,
        "started_at": trip.started_at,
        "start_lat": trip.start_lat,
        "start_lng": trip.start_lng,
        "notes": trip.notes,
        "created_at": trip.created_at,
    }


@router.post("/trips/{trip_id}/stop")
def stop_trip(
    trip_id: int,
    body: TripStopBody,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="You do not own this trip")
    if trip.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip is not active (current status: {trip.status})",
        )

    trip.status = "completed"
    trip.ended_at = datetime.now(timezone.utc)
    if body.lat is not None:
        trip.end_lat = body.lat
    if body.lng is not None:
        trip.end_lng = body.lng
    if body.notes is not None:
        trip.notes = body.notes

    # Notify route students
    allocation = db.query(BusAllocation).filter(BusAllocation.id == trip.allocation_id).first()
    if allocation:
        bus_number = allocation.bus.bus_number if allocation.bus else "?"
        route_code = allocation.route.route_code if allocation.route else "?"
        _notify_route_students(
            allocation,
            db,
            title="Bus Journey Ended",
            message=f"Bus #{bus_number} (Route {route_code}) has ended its journey. [Route-Level Notice]",
            category="trip",
            priority="normal",
        )

    db.commit()
    db.refresh(trip)

    return {
        "id": trip.id,
        "status": trip.status,
        "started_at": trip.started_at,
        "ended_at": trip.ended_at,
        "end_lat": trip.end_lat,
        "end_lng": trip.end_lng,
        "notes": trip.notes,
    }


@router.get("/trips/current")
def get_current_trip(
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    trip = (
        db.query(Trip)
        .filter(Trip.driver_id == driver.id, Trip.status == "active")
        .first()
    )
    if not trip:
        return {"current_trip": None}

    return {
        "current_trip": {
            "id": trip.id,
            "allocation_id": trip.allocation_id,
            "route_id": trip.route_id,
            "bus_id": trip.bus_id,
            "status": trip.status,
            "started_at": trip.started_at,
            "start_lat": trip.start_lat,
            "start_lng": trip.start_lng,
            "notes": trip.notes,
            "bus_number": trip.bus.bus_number if trip.bus else None,
            "route_code": trip.route.route_code if trip.route else None,
        }
    }


@router.get("/trips")
def list_trips(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    q = db.query(Trip).filter(Trip.driver_id == driver.id).order_by(Trip.started_at.desc())
    total = q.count()
    trips = q.offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for t in trips:
        duration = None
        if t.started_at and t.ended_at:
            duration = round((t.ended_at - t.started_at).total_seconds() / 60, 1)
        result.append(
            {
                "id": t.id,
                "status": t.status,
                "started_at": t.started_at,
                "ended_at": t.ended_at,
                "bus_number": t.bus.bus_number if t.bus else None,
                "route_code": t.route.route_code if t.route else None,
                "duration_minutes": duration,
                "notes": t.notes,
            }
        )

    return {"total": total, "page": page, "page_size": page_size, "trips": result}


# ---------------------------------------------------------------------------
# B. GPS LOCATION
# ---------------------------------------------------------------------------

@router.post("/location")
def post_location(
    body: LocationBody,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)
    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active allocation found for this driver",
        )

    loc = BusLocation(
        bus_id=allocation.bus_id,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)

    recorded_ist = loc.recorded_at.astimezone(IST).isoformat() if loc.recorded_at else None
    return {"success": True, "recorded_at": recorded_ist}


@router.get("/location")
def get_location(
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)
    if not allocation:
        return {"location": None}

    loc = (
        db.query(BusLocation)
        .filter(BusLocation.bus_id == allocation.bus_id)
        .order_by(BusLocation.recorded_at.desc())
        .first()
    )
    if not loc:
        return {"location": None}

    return {
        "location": {
            "bus_id": loc.bus_id,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "recorded_at": loc.recorded_at.astimezone(IST).isoformat() if loc.recorded_at else None,
        }
    }


# ---------------------------------------------------------------------------
# C. BOARDING RECORDS
# ---------------------------------------------------------------------------

@router.get("/boarding-records")
def list_boarding_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    trip_id: Optional[int] = Query(None),
    date: Optional[str] = Query(None),  # YYYY-MM-DD
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)
    if not allocation:
        return {"total": 0, "page": page, "page_size": page_size, "records": []}

    q = db.query(Attendance).filter(
        Attendance.bus_allocation_id == allocation.id
    )

    if trip_id is not None:
        q = q.filter(Attendance.trip_id == trip_id)

    if date is not None:
        q = q.filter(
            sqlfunc.cast(
                sqlfunc.timezone("Asia/Kolkata", Attendance.boarding_time),
                sqlfunc.Date(),
            )
            == date
        )

    total = q.count()
    records = q.order_by(Attendance.boarding_time.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for rec in records:
        result.append(
            {
                "id": rec.id,
                "student_id": rec.student_id,
                "student_name": rec.student.full_name if rec.student else None,
                "registration_number": rec.student.registration_number if rec.student else None,
                "boarding_time": rec.boarding_time,
                "verification_method": rec.verification_method,
                "trip_id": rec.trip_id,
            }
        )

    return {"total": total, "page": page, "page_size": page_size, "records": result}


# ---------------------------------------------------------------------------
# D. PROFILE
# ---------------------------------------------------------------------------

@router.get("/profile")
def get_profile(
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)

    allocation_data = None
    bus_data = None
    route_data = None
    if allocation:
        allocation_data = {
            "id": allocation.id,
            "status": allocation.status,
            "start_date": allocation.start_date,
            "end_date": allocation.end_date,
        }
        if allocation.bus:
            bus_data = {
                "id": allocation.bus.id,
                "bus_number": allocation.bus.bus_number,
                "registration_number": allocation.bus.registration_number,
                "capacity": allocation.bus.capacity,
            }
        if allocation.route:
            route_data = {
                "id": allocation.route.id,
                "route_code": allocation.route.route_code,
                "route_name": allocation.route.route_name,
                "area": allocation.route.area,
            }

    return {
        "id": driver.id,
        "driver_name": driver.driver_name,
        "phone": driver.phone,
        "license_number": driver.license_number,
        "profile_photo_url": getattr(driver, "profile_photo_url", None),
        "experience_years": getattr(driver, "experience_years", None),
        "address": getattr(driver, "address", None),
        "allocation": allocation_data,
        "bus": bus_data,
        "route": route_data,
    }


@router.patch("/profile")
def update_profile(
    body: DriverProfileUpdate,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)

    if body.phone is not None:
        driver.phone = body.phone
    if body.address is not None and hasattr(driver, "address"):
        driver.address = body.address
    if body.experience_years is not None and hasattr(driver, "experience_years"):
        driver.experience_years = body.experience_years

    db.commit()
    db.refresh(driver)

    return {
        "id": driver.id,
        "driver_name": driver.driver_name,
        "phone": driver.phone,
        "license_number": driver.license_number,
        "profile_photo_url": getattr(driver, "profile_photo_url", None),
        "experience_years": getattr(driver, "experience_years", None),
        "address": getattr(driver, "address", None),
    }


@router.post("/profile/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)

    upload_dir = "/home/joshu/projects/VahMitra_Web/backend/uploads/driver_photos"
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{driver.id}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    relative_path = f"uploads/driver_photos/{filename}"
    if hasattr(driver, "profile_photo_url"):
        driver.profile_photo_url = relative_path
        db.commit()

    return {"profile_photo_url": relative_path}


# ---------------------------------------------------------------------------
# E. FUEL RECORDS
# ---------------------------------------------------------------------------

@router.post("/fuel-records")
def create_fuel_record(
    body: FuelRecordBody,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)

    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active allocation found — cannot log fuel without an active bus assignment",
        )

    recorded_at = None
    if body.recorded_at:
        try:
            recorded_at = datetime.fromisoformat(body.recorded_at)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid recorded_at datetime format")

    record = FuelRecord(
        bus_id=allocation.bus_id,
        driver_id=driver.id,
        allocation_id=allocation.id,
        fuel_litres=body.fuel_litres,
        amount_paid=body.amount_paid,
        odometer_km=body.odometer_km,
        fuel_station=body.fuel_station,
        notes=body.notes,
    )
    if recorded_at:
        record.recorded_at = recorded_at

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "bus_id": record.bus_id,
        "driver_id": record.driver_id,
        "allocation_id": record.allocation_id,
        "recorded_at": record.recorded_at,
        "fuel_litres": record.fuel_litres,
        "amount_paid": record.amount_paid,
        "odometer_km": record.odometer_km,
        "fuel_station": record.fuel_station,
        "notes": record.notes,
        "created_at": record.created_at,
    }


@router.get("/fuel-records")
def list_fuel_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    q = db.query(FuelRecord).filter(FuelRecord.driver_id == driver.id).order_by(FuelRecord.recorded_at.desc())
    total = q.count()
    records = q.offset((page - 1) * page_size).limit(page_size).all()

    # Summary across ALL records (not just this page)
    all_records = db.query(FuelRecord).filter(FuelRecord.driver_id == driver.id).all()
    total_litres = sum(r.fuel_litres for r in all_records)
    total_paid = sum(r.amount_paid for r in all_records)

    result = [
        {
            "id": r.id,
            "bus_id": r.bus_id,
            "allocation_id": r.allocation_id,
            "recorded_at": r.recorded_at,
            "fuel_litres": r.fuel_litres,
            "amount_paid": r.amount_paid,
            "odometer_km": r.odometer_km,
            "fuel_station": r.fuel_station,
            "notes": r.notes,
            "created_at": r.created_at,
        }
        for r in records
    ]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": result,
        "summary": {
            "total_fuel_litres": round(total_litres, 2),
            "total_amount_paid": round(total_paid, 2),
            "record_count": len(all_records),
        },
    }


# ---------------------------------------------------------------------------
# F. SERVICE RECORDS
# ---------------------------------------------------------------------------

@router.post("/service-records")
def create_service_record(
    body: ServiceRecordBody,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)

    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active allocation found — cannot log service without an active bus assignment",
        )

    try:
        service_date = datetime.fromisoformat(body.service_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid service_date format")

    next_service_date = None
    if body.next_service_date:
        try:
            next_service_date = datetime.fromisoformat(body.next_service_date)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid next_service_date format")

    record = ServiceRecord(
        bus_id=allocation.bus_id,
        driver_id=driver.id,
        allocation_id=allocation.id,
        service_date=service_date,
        category=body.category,
        description=body.description,
        odometer_km=body.odometer_km,
        service_centre=body.service_centre,
        cost=body.cost,
        next_service_date=next_service_date,
        next_service_km=body.next_service_km,
        status="pending",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "bus_id": record.bus_id,
        "driver_id": record.driver_id,
        "allocation_id": record.allocation_id,
        "service_date": record.service_date,
        "category": record.category,
        "description": record.description,
        "odometer_km": record.odometer_km,
        "service_centre": record.service_centre,
        "cost": record.cost,
        "next_service_date": record.next_service_date,
        "next_service_km": record.next_service_km,
        "status": record.status,
        "created_at": record.created_at,
    }


@router.get("/service-records")
def list_service_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    q = (
        db.query(ServiceRecord)
        .filter(ServiceRecord.driver_id == driver.id)
        .order_by(ServiceRecord.service_date.desc())
    )
    total = q.count()
    records = q.offset((page - 1) * page_size).limit(page_size).all()

    # Upcoming: next 2 by next_service_date (non-null, future)
    now = datetime.now(timezone.utc)
    upcoming = (
        db.query(ServiceRecord)
        .filter(
            ServiceRecord.driver_id == driver.id,
            ServiceRecord.next_service_date.isnot(None),
            ServiceRecord.next_service_date > now,
        )
        .order_by(ServiceRecord.next_service_date.asc())
        .limit(2)
        .all()
    )

    def _serialize(r):
        return {
            "id": r.id,
            "bus_id": r.bus_id,
            "service_date": r.service_date,
            "category": r.category,
            "description": r.description,
            "odometer_km": r.odometer_km,
            "service_centre": r.service_centre,
            "cost": r.cost,
            "next_service_date": r.next_service_date,
            "next_service_km": r.next_service_km,
            "status": r.status,
            "created_at": r.created_at,
        }

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": [_serialize(r) for r in records],
        "upcoming": [_serialize(r) for r in upcoming],
    }


# ---------------------------------------------------------------------------
# G. VEHICLE ISSUE REPORTS
# ---------------------------------------------------------------------------

@router.post("/vehicle-reports")
def create_vehicle_report(
    body: VehicleReportBody,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    allocation = _get_active_allocation(driver, db)
    if not allocation or not allocation.bus_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active allocation with a bus found for this driver",
        )

    # Generate ticket number using DB sequence
    year = datetime.now(IST).year
    seq_val = db.execute(text("SELECT nextval('vehicle_issue_ticket_seq')")).scalar()
    ticket_number = f"VIR-{year}-{seq_val:05d}"

    report = VehicleIssueReport(
        bus_id=allocation.bus_id,
        driver_id=driver.id,
        trip_id=body.trip_id,
        ticket_number=ticket_number,
        title=body.title,
        category=body.category,
        description=body.description,
        severity=body.severity,
        latitude=body.latitude,
        longitude=body.longitude,
        status="open",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "ticket_number": report.ticket_number,
        "bus_id": report.bus_id,
        "driver_id": report.driver_id,
        "trip_id": report.trip_id,
        "title": report.title,
        "category": report.category,
        "description": report.description,
        "severity": report.severity,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "status": report.status,
        "created_at": report.created_at,
    }


@router.get("/vehicle-reports")
def list_vehicle_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    q = (
        db.query(VehicleIssueReport)
        .filter(VehicleIssueReport.driver_id == driver.id)
        .order_by(VehicleIssueReport.created_at.desc())
    )
    total = q.count()
    reports = q.offset((page - 1) * page_size).limit(page_size).all()

    result = [
        {
            "id": r.id,
            "ticket_number": r.ticket_number,
            "title": r.title,
            "category": r.category,
            "severity": r.severity,
            "status": r.status,
            "trip_id": r.trip_id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "management_response": r.management_response,
        }
        for r in reports
    ]

    return {"total": total, "page": page, "page_size": page_size, "reports": result}


@router.get("/vehicle-reports/{ticket_number}")
def get_vehicle_report(
    ticket_number: str,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    report = (
        db.query(VehicleIssueReport)
        .filter(VehicleIssueReport.ticket_number == ticket_number)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="You do not own this report")

    return {
        "id": report.id,
        "ticket_number": report.ticket_number,
        "bus_id": report.bus_id,
        "driver_id": report.driver_id,
        "trip_id": report.trip_id,
        "title": report.title,
        "category": report.category,
        "description": report.description,
        "severity": report.severity,
        "evidence_file_path": report.evidence_file_path,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "status": report.status,
        "management_response": report.management_response,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }


# ---------------------------------------------------------------------------
# H. NOTIFICATIONS
# ---------------------------------------------------------------------------

@router.get("/notifications")
def list_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)

    # Always compute unread count
    total_unread = (
        db.query(DriverNotification)
        .filter(
            DriverNotification.driver_id == driver.id,
            DriverNotification.is_read == False,  # noqa: E712
        )
        .count()
    )

    q = db.query(DriverNotification).filter(DriverNotification.driver_id == driver.id)
    if unread_only:
        q = q.filter(DriverNotification.is_read == False)  # noqa: E712
    q = q.order_by(DriverNotification.created_at.desc())

    total = q.count()
    notifications = q.offset((page - 1) * page_size).limit(page_size).all()

    result = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "priority": n.priority,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifications
    ]

    return {
        "total_unread": total_unread,
        "total": total,
        "page": page,
        "page_size": page_size,
        "notifications": result,
    }


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    notif = db.query(DriverNotification).filter(DriverNotification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.driver_id != driver.id:
        raise HTTPException(status_code=403, detail="You do not own this notification")

    notif.is_read = True
    db.commit()
    return {"success": True}


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    current_user=Depends(require_driver),
    db: Session = Depends(get_db),
):
    driver = _get_driver(current_user, db)
    updated = (
        db.query(DriverNotification)
        .filter(
            DriverNotification.driver_id == driver.id,
            DriverNotification.is_read == False,  # noqa: E712
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return {"success": True, "updated": updated}
