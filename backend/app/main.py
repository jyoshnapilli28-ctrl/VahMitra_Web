
from fastapi import FastAPI, Depends

from app.auth import router as auth_router
from app.student_dashboard import router as student_dashboard_router
from app.driver_dashboard import router as driver_dashboard_router
from app.permissions import require_management, require_student
from app.students import router as students_router
from app.drivers import router as drivers_router
from app.buses import router as buses_router
from app.routes import router as routes_router
from app.allocations import router as allocations_router
from app.management import router as management_router
from app import driver_portal


app = FastAPI(
    title="VAHMITRA API",
    description="Smart Bus Tracking & Management System",
    version="1.0.0"
)


# Authentication routes
app.include_router(auth_router)
app.include_router(student_dashboard_router)
app.include_router(driver_dashboard_router)

# Student management routes
app.include_router(students_router)

# Driver management routes
app.include_router(drivers_router)

# Bus management routes
app.include_router(buses_router)

# Route management routes
app.include_router(routes_router)

# Bus allocation routes
app.include_router(allocations_router)

# Management dashboard routes
app.include_router(management_router)

# Driver portal routes
app.include_router(driver_portal.router)


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to VAHMITRA API",
        "status": "running"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# Management-only test endpoint
@app.get("/management/test")
def management_test(
    current_user=Depends(require_management)
):
    return {
        "message": "Management access granted",
        "username": current_user.username,
        "role": current_user.role
    }


# Student-only test endpoint
@app.get("/student/test")
def student_test(
    current_user=Depends(require_student)
):
    return {
        "message": "Student access granted",
        "username": current_user.username,
        "role": current_user.role
    }
