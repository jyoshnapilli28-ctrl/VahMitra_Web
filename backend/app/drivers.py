
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import User, Driver, BusAllocation
from app.security import hash_password
from app.permissions import require_management


router = APIRouter(
    prefix="/management/drivers",
    tags=["Driver Management"],
    dependencies=[Depends(require_management)]
)


class DriverCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=12)
    driver_name: str = Field(min_length=1, max_length=150)
    phone: str | None = None
    license_number: str | None = None


@router.get("/")
def get_drivers(
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Driver).options(
        joinedload(Driver.user),
        joinedload(Driver.bus_allocations).joinedload(
            BusAllocation.bus
        ),
        joinedload(Driver.bus_allocations).joinedload(
            BusAllocation.route
        )
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (Driver.driver_name.ilike(term)) |
            (Driver.phone.ilike(term)) |
            (Driver.license_number.ilike(term))
        )

    total = query.count()

    drivers = query.order_by(
        Driver.driver_name
    ).offset(skip).limit(limit).all()

    results = []

    for driver in drivers:
        allocations = []

        for allocation in driver.bus_allocations:
            bus = allocation.bus
            route = allocation.route

            allocations.append({
                "allocation_id": allocation.id,
                "status": allocation.status,
                "start_date": allocation.start_date,
                "end_date": allocation.end_date,
                "bus": {
                    "id": bus.id,
                    "bus_number": bus.bus_number,
                    "registration_number": bus.registration_number
                } if bus else None,
                "route": {
                    "id": route.id,
                    "area": route.area,
                    "route_code": route.route_code,
                    "route_name": route.route_name
                } if route else None
            })

        results.append({
            "id": driver.id,
            "user_id": driver.user_id,
            "driver_name": driver.driver_name,
            "phone": driver.phone,
            "license_number": driver.license_number,
            "account_created": driver.user is not None,
            "account_active": (
                driver.user.is_active
                if driver.user else False
            ),
            "allocations": allocations
        })

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "drivers": results
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_driver(
    driver_data: DriverCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.username == driver_data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    if driver_data.license_number:
        existing_license = db.query(Driver).filter(
            Driver.license_number == driver_data.license_number
        ).first()

        if existing_license:
            raise HTTPException(
                status_code=409,
                detail="License number already exists"
            )

    user = User(
        username=driver_data.username,
        password_hash=hash_password(driver_data.password),
        role="driver",
        is_active=True
    )

    try:
        db.add(user)
        db.flush()

        driver = Driver(
            user_id=user.id,
            driver_name=driver_data.driver_name,
            phone=driver_data.phone,
            license_number=driver_data.license_number
        )

        db.add(driver)
        db.commit()
        db.refresh(driver)

        return {
            "message": "Driver account created successfully",
            "driver": {
                "id": driver.id,
                "user_id": driver.user_id,
                "username": user.username,
                "driver_name": driver.driver_name,
                "phone": driver.phone,
                "license_number": driver.license_number,
                "role": user.role
            }
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A driver with these details already exists"
        )

    except Exception:
        db.rollback()
        raise
