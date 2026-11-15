
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import User, Student, StudentRouteAssignment
from app.security import hash_password
from app.permissions import require_management


router = APIRouter(
    prefix="/management/students",
    tags=["Student Management"],
    dependencies=[Depends(require_management)]
)


class StudentCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=12)
    registration_number: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    email: str | None = None
    phone: str | None = None


@router.get("/")
def get_students(
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Student).options(
        joinedload(Student.user),
        joinedload(Student.route_assignments).joinedload(
            StudentRouteAssignment.route
        )
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (Student.full_name.ilike(term)) |
            (Student.registration_number.ilike(term)) |
            (Student.email.ilike(term))
        )

    total = query.count()

    students = query.order_by(
        Student.full_name
    ).offset(skip).limit(limit).all()

    results = []

    for student in students:
        assignments = []

        for assignment in student.route_assignments:
            route = assignment.route

            assignments.append({
                "assignment_id": assignment.id,
                "status": assignment.status,
                "start_date": assignment.start_date,
                "end_date": assignment.end_date,
                "route": {
                    "id": route.id,
                    "area": route.area,
                    "route_code": route.route_code,
                    "route_name": route.route_name
                } if route else None
            })

        results.append({
            "id": student.id,
            "user_id": student.user_id,
            "registration_number": student.registration_number,
            "full_name": student.full_name,
            "email": student.email,
            "phone": student.phone,
            "account_created": student.user is not None,
            "account_active": (
                student.user.is_active
                if student.user else False
            ),
            "route_assignments": assignments
        })

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "students": results
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.username == student_data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    existing_student = db.query(Student).filter(
        Student.registration_number == student_data.registration_number
    ).first()

    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration number already exists"
        )

    if student_data.email:
        existing_email = db.query(Student).filter(
            Student.email == student_data.email
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )

    user = User(
        username=student_data.username,
        password_hash=hash_password(student_data.password),
        role="student",
        is_active=True
    )

    try:
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            registration_number=student_data.registration_number,
            full_name=student_data.full_name,
            email=student_data.email,
            phone=student_data.phone
        )

        db.add(student)
        db.commit()
        db.refresh(student)

        return {
            "message": "Student account created successfully",
            "student": {
                "id": student.id,
                "user_id": student.user_id,
                "username": user.username,
                "registration_number": student.registration_number,
                "full_name": student.full_name,
                "email": student.email,
                "phone": student.phone,
                "role": user.role
            }
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A student with these details already exists"
        )

    except Exception:
        db.rollback()
        raise
