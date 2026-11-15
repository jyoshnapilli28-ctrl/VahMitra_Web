
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Bus
from app.permissions import require_management


router = APIRouter(
    prefix="/management/buses",
    tags=["Bus Management"],
    dependencies=[Depends(require_management)]
)


class BusCreate(BaseModel):
    bus_number: str = Field(min_length=1, max_length=30)
    registration_number: str = Field(min_length=1, max_length=30)
    capacity: int = Field(gt=0)
    

class BusStatusUpdate(BaseModel):
    is_active: bool


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_bus(
    bus_data: BusCreate,
    db: Session = Depends(get_db)
):
    existing_bus = db.query(Bus).filter(
        (Bus.bus_number == bus_data.bus_number) |
        (Bus.registration_number == bus_data.registration_number)
    ).first()

    if existing_bus:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bus number or registration number already exists"
        )

    bus = Bus(
        bus_number=bus_data.bus_number,
        registration_number=bus_data.registration_number,
        capacity=bus_data.capacity,
        is_active=True
    )

    try:
        db.add(bus)
        db.commit()
        db.refresh(bus)

        return {
            "message": "Bus registered successfully",
            "bus": {
                "id": bus.id,
                "bus_number": bus.bus_number,
                "registration_number": bus.registration_number,
                "capacity": bus.capacity,
                "is_active": bus.is_active
            }
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bus registration already exists"
        )


@router.get("/")
def get_buses(db: Session = Depends(get_db)):
    buses = db.query(Bus).order_by(Bus.id).all()

    return {
        "total": len(buses),
        "buses": [
            {
                "id": bus.id,
                "bus_number": bus.bus_number,
                "registration_number": bus.registration_number,
                "capacity": bus.capacity,
                "is_active": bus.is_active
            }
            for bus in buses
        ]
    }


@router.patch("/{bus_id}/status")
def update_bus_status(
    bus_id: int,
    status_data: BusStatusUpdate,
    db: Session = Depends(get_db)
):
    bus = db.query(Bus).filter(
        Bus.id == bus_id
    ).first()

    if not bus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bus not found"
        )

    bus.is_active = status_data.is_active
    db.commit()
    db.refresh(bus)

    return {
        "message": "Bus status updated successfully",
        "bus_id": bus.id,
        "is_active": bus.is_active
    }
