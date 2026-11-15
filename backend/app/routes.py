
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Route, RouteStop
from app.permissions import require_management


router = APIRouter(
    prefix="/management/routes",
    tags=["Route Management"],
    dependencies=[Depends(require_management)]
)


class RouteCreate(BaseModel):
    area: str = Field(min_length=1, max_length=50)
    route_code: str = Field(min_length=1, max_length=30)
    route_name: str = Field(min_length=1, max_length=150)
    start_point: str | None = Field(default=None, max_length=150)
    end_point: str | None = Field(default=None, max_length=150)


class RouteStopCreate(BaseModel):
    stop_name: str = Field(min_length=1, max_length=150)
    sequence_number: int = Field(gt=0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_route(
    route_data: RouteCreate,
    db: Session = Depends(get_db)
):
    area = route_data.area.strip()
    route_code = route_data.route_code.strip()
    route_name = route_data.route_name.strip()

    if not area or not route_code or not route_name:
        raise HTTPException(
            status_code=422,
            detail="Area, route code and route name cannot be empty"
        )

    existing_route = db.query(Route).filter(
        Route.area == area,
        Route.route_code == route_code
    ).first()

    if existing_route:
        raise HTTPException(
            status_code=409,
            detail="This route code already exists in this area"
        )

    route = Route(
        area=area,
        route_code=route_code,
        route_name=route_name,
        start_point=route_data.start_point.strip() if route_data.start_point else None,
        end_point=route_data.end_point.strip() if route_data.end_point else None,
        is_active=True
    )

    try:
        db.add(route)
        db.commit()
        db.refresh(route)

        return {
            "message": "Route created successfully",
            "route": {
                "id": route.id,
                "area": route.area,
                "route_code": route.route_code,
                "route_name": route.route_name,
                "start_point": route.start_point,
                "end_point": route.end_point,
                "is_active": route.is_active
            }
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Route already exists in this area"
        )


@router.get("/")
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(Route).order_by(
        Route.area,
        Route.route_code
    ).all()

    return {
        "total": len(routes),
        "routes": [
            {
                "id": route.id,
                "area": route.area,
                "route_code": route.route_code,
                "route_name": route.route_name,
                "start_point": route.start_point,
                "end_point": route.end_point,
                "is_active": route.is_active
            }
            for route in routes
        ]
    }


@router.post("/{route_id}/stops/", status_code=status.HTTP_201_CREATED)
def add_route_stop(
    route_id: int,
    stop_data: RouteStopCreate,
    db: Session = Depends(get_db)
):
    route = db.query(Route).filter(
        Route.id == route_id
    ).first()

    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    stop_name = stop_data.stop_name.strip()

    if not stop_name:
        raise HTTPException(status_code=422, detail="Stop name cannot be empty")

    existing_stop = db.query(RouteStop).filter(
        RouteStop.route_id == route_id,
        RouteStop.sequence_number == stop_data.sequence_number
    ).first()

    if existing_stop:
        raise HTTPException(
            status_code=409,
            detail="This sequence number already exists for this route"
        )

    stop = RouteStop(
        route_id=route_id,
        stop_name=stop_name,
        sequence_number=stop_data.sequence_number,
        latitude=stop_data.latitude,
        longitude=stop_data.longitude
    )

    try:
        db.add(stop)
        db.commit()
        db.refresh(stop)

        return {
            "message": "Route stop added successfully",
            "stop": {
                "id": stop.id,
                "route_id": stop.route_id,
                "stop_name": stop.stop_name,
                "sequence_number": stop.sequence_number,
                "latitude": stop.latitude,
                "longitude": stop.longitude
            }
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This stop sequence already exists for this route"
        )


@router.get("/{route_id}/stops/")
def get_route_stops(
    route_id: int,
    db: Session = Depends(get_db)
):
    route = db.query(Route).filter(
        Route.id == route_id
    ).first()

    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    stops = db.query(RouteStop).filter(
        RouteStop.route_id == route_id
    ).order_by(RouteStop.sequence_number).all()

    return {
        "route_id": route_id,
        "route_name": route.route_name,
        "total_stops": len(stops),
        "stops": [
            {
                "id": stop.id,
                "stop_name": stop.stop_name,
                "sequence_number": stop.sequence_number,
                "latitude": stop.latitude,
                "longitude": stop.longitude
            }
            for stop in stops
        ]
    }
