
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Bus, Driver, Route, BusAllocation
from app.permissions import require_management


router = APIRouter(
    prefix="/management/allocations",
    tags=["Bus Allocations"],
    dependencies=[Depends(require_management)]
)


class AllocationCreate(BaseModel):
    bus_id: int = Field(gt=0)
    driver_id: int = Field(gt=0)
    route_id: int = Field(gt=0)
    start_date: datetime
    end_date: datetime | None = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_allocation(
    allocation_data: AllocationCreate,
    db: Session = Depends(get_db)
):
    start_date = allocation_data.start_date
    end_date = allocation_data.end_date

    if start_date.tzinfo is None:
        raise HTTPException(
            status_code=422,
            detail="Start date must include a timezone"
        )

    if end_date is not None:
        if end_date.tzinfo is None:
            raise HTTPException(
                status_code=422,
                detail="End date must include a timezone"
            )

        if end_date <= start_date:
            raise HTTPException(
                status_code=422,
                detail="End date must be after start date"
            )

    bus = db.query(Bus).filter(
        Bus.id == allocation_data.bus_id
    ).first()

    if not bus or not bus.is_active:
        raise HTTPException(
            status_code=404,
            detail="Bus not found or inactive"
        )

    driver = db.query(Driver).filter(
        Driver.id == allocation_data.driver_id
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    route = db.query(Route).filter(
        Route.id == allocation_data.route_id
    ).first()

    if not route or not route.is_active:
        raise HTTPException(
            status_code=404,
            detail="Route not found or inactive"
        )

    overlapping = db.query(BusAllocation).filter(
        BusAllocation.status == "active",
        or_(
            BusAllocation.bus_id == allocation_data.bus_id,
            BusAllocation.driver_id == allocation_data.driver_id
        ),
        BusAllocation.start_date < (
            end_date if end_date else datetime.max.replace(tzinfo=timezone.utc)
        ),
        or_(
            BusAllocation.end_date.is_(None),
            BusAllocation.end_date > start_date
        )
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bus or driver already has an overlapping active allocation"
        )

    allocation = BusAllocation(
        bus_id=allocation_data.bus_id,
        driver_id=allocation_data.driver_id,
        route_id=allocation_data.route_id,
        start_date=start_date,
        end_date=end_date,
        status="active"
    )

    try:
        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        return {
            "message": "Bus allocation created successfully",
            "allocation": {
                "id": allocation.id,
                "bus_id": allocation.bus_id,
                "driver_id": allocation.driver_id,
                "route_id": allocation.route_id,
                "start_date": allocation.start_date,
                "end_date": allocation.end_date,
                "status": allocation.status
            }
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Allocation could not be created due to a database conflict"
        )


@router.get("/")
def get_allocations(db: Session = Depends(get_db)):
    allocations = db.query(BusAllocation).order_by(
        BusAllocation.id
    ).all()

    return {
        "total": len(allocations),
        "allocations": [
            {
                "id": allocation.id,
                "bus_id": allocation.bus_id,
                "driver_id": allocation.driver_id,
                "route_id": allocation.route_id,
                "start_date": allocation.start_date,
                "end_date": allocation.end_date,
                "status": allocation.status
            }
            for allocation in allocations
        ]
    }
