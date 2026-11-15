from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


# ==============================
# AUTHENTICATION
# ==============================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="user", uselist=False)
    driver = relationship("Driver", back_populates="user", uselist=False)


# ==============================
# STUDENTS
# ==============================

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=True
    )

    registration_number = Column(
        String(50),
        unique=True,
        nullable=False
    )

    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)

    # Student personalization & profile
    nickname = Column(String(50), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    department = Column(String(100), nullable=True)
    academic_year = Column(String(50), nullable=True)

    onboarding_code_hash = Column(String(255), nullable=True)
    onboarding_code_used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="student")

    route_assignments = relationship(
        "StudentRouteAssignment",
        back_populates="student"
    )

    attendance_records = relationship(
        "Attendance",
        back_populates="student"
    )

    complaints = relationship(
        "Complaint",
        back_populates="student",
        cascade="all, delete-orphan"
    )

    notifications = relationship(
        "Notification",
        back_populates="student",
        cascade="all, delete-orphan"
    )

    discussion_messages = relationship(
        "DiscussionMessage",
        back_populates="student",
        cascade="all, delete-orphan"
    )


# ==============================
# DRIVERS
# ==============================

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=True
    )

    driver_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    license_number = Column(String(50), unique=True, nullable=True)

    onboarding_code_hash = Column(String(255), nullable=True)
    onboarding_code_used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="driver")

    bus_allocations = relationship(
        "BusAllocation",
        back_populates="driver"
    )

    trips = relationship("Trip", back_populates="driver")
    fuel_records = relationship("FuelRecord", back_populates="driver")
    service_records = relationship("ServiceRecord", back_populates="driver")
    vehicle_reports = relationship("VehicleIssueReport", back_populates="driver")
    driver_notifications = relationship("DriverNotification", back_populates="driver")


# ==============================
# BUSES
# ==============================

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(30), unique=True, nullable=False)
    registration_number = Column(String(30), unique=True, nullable=False)
    capacity = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)

    allocations = relationship("BusAllocation", back_populates="bus")
    locations = relationship("BusLocation", back_populates="bus")


# ==============================
# ROUTES
# ==============================

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(String(50), nullable=False)
    route_code = Column(String(30), nullable=False)
    route_name = Column(String(150), nullable=False)
    start_point = Column(String(150), nullable=True)
    end_point = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)

    stops = relationship("RouteStop", back_populates="route")
    allocations = relationship("BusAllocation", back_populates="route")

    student_assignments = relationship(
        "StudentRouteAssignment",
        back_populates="route"
    )

    __table_args__ = (
        UniqueConstraint(
            "area",
            "route_code",
            name="uq_route_area_code"
        ),
    )


# ==============================
# BUS ALLOCATIONS
# ==============================

class BusAllocation(Base):
    __tablename__ = "bus_allocations"

    id = Column(Integer, primary_key=True, index=True)

    bus_id = Column(
        Integer,
        ForeignKey("buses.id"),
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    route_id = Column(
        Integer,
        ForeignKey("routes.id"),
        nullable=False
    )

    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bus = relationship("Bus", back_populates="allocations")
    driver = relationship("Driver", back_populates="bus_allocations")
    route = relationship("Route", back_populates="allocations")

    attendance_records = relationship(
        "Attendance",
        back_populates="bus_allocation"
    )


# ==============================
# ROUTE STOPS
# ==============================

class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(Integer, primary_key=True, index=True)

    route_id = Column(
        Integer,
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False
    )

    stop_name = Column(String(150), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    route = relationship("Route", back_populates="stops")

    __table_args__ = (
        UniqueConstraint(
            "route_id",
            "sequence_number",
            name="uq_route_stop_sequence"
        ),
    )


# ==============================
# STUDENT ROUTE ASSIGNMENTS
# ==============================

class StudentRouteAssignment(Base):
    __tablename__ = "student_route_assignments"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    route_id = Column(
        Integer,
        ForeignKey("routes.id"),
        nullable=False
    )

    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="active", nullable=False)

    student = relationship("Student", back_populates="route_assignments")
    route = relationship("Route", back_populates="student_assignments")


# ==============================
# ATTENDANCE
# ==============================

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    bus_allocation_id = Column(
        Integer,
        ForeignKey("bus_allocations.id"),
        nullable=False
    )

    boarding_time = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    verification_method = Column(String(30), nullable=False)

    student = relationship("Student", back_populates="attendance_records")

    bus_allocation = relationship(
        "BusAllocation",
        back_populates="attendance_records"
    )

    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    trip = relationship("Trip", back_populates="attendance_records")


# ==============================
# BUS GPS LOCATIONS
# ==============================

class BusLocation(Base):
    __tablename__ = "bus_locations"

    id = Column(Integer, primary_key=True, index=True)

    bus_id = Column(
        Integer,
        ForeignKey("buses.id", ondelete="CASCADE"),
        nullable=False
    )

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    recorded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    bus = relationship("Bus", back_populates="locations")


# ==============================
# ANNOUNCEMENTS
# ==============================

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=False)
    category = Column(String(50), default="general", nullable=False)  # route_change, delay, breakdown, holiday, schedule, emergency, general
    priority = Column(String(30), default="normal", nullable=False)   # normal, important, emergency
    is_pinned = Column(Boolean, default=False, nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="SET NULL"), nullable=True)
    published_by = Column(String(100), default="Campus Transport Office", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    route = relationship("Route", backref="announcements")


# ==============================
# COMPLAINTS
# ==============================

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(40), unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # delay, driver, vehicle, missed_pickup, route, attendance, safety, other
    description = Column(String(3000), nullable=False)
    image_url = Column(String(500), nullable=True)
    evidence_file_path = Column(String(500), nullable=True)
    status = Column(String(30), default="Submitted", nullable=False)  # Submitted, Under Review, In Progress, Resolved, Rejected
    management_response = Column(String(3000), nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    archived_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("Student", back_populates="complaints")
    status_logs = relationship("ComplaintStatusLog", back_populates="complaint", order_by="ComplaintStatusLog.created_at.asc()")


class ComplaintStatusLog(Base):
    __tablename__ = "complaint_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="RESTRICT"), nullable=False, index=True)
    complaint_ticket_number = Column(String(40), nullable=False, index=True)
    old_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    notes = Column(Text, nullable=True)
    updated_by_role = Column(String(30), nullable=False)
    updated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    complaint = relationship("Complaint", back_populates="status_logs")


# ==============================
# DIRECT MESSAGES
# ==============================

class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    broadcast_id = Column(String(64), nullable=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    sender_name = Column(String(100), nullable=False)
    sender_role = Column(String(30), nullable=False)  # "management" or "driver"
    recipient_name = Column(String(100), nullable=False)
    recipient_role = Column(String(30), default="student", nullable=False)
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    is_deleted_by_sender = Column(Boolean, default=False, nullable=False)
    is_deleted_by_recipient = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


# ==============================
# NOTIFICATIONS
# ==============================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(String(1000), nullable=False)
    category = Column(String(50), default="general", nullable=False)  # bus_approaching, delay, route_change, attendance, complaint_status, emergency, announcement
    priority = Column(String(30), default="normal", nullable=False)   # normal, important, emergency
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="notifications")


# ==============================
# DISCUSSION MESSAGES
# ==============================

class DiscussionMessage(Base):
    __tablename__ = "discussion_messages"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="SET NULL"), nullable=True)
    content = Column(String(2000), nullable=False)
    is_reported = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="discussion_messages")
    route = relationship("Route", backref="discussion_messages")


# ==============================
# DRIVER PORTAL — NEW MODELS
# ==============================

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("bus_allocations.id", ondelete="RESTRICT"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="RESTRICT"), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="RESTRICT"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), nullable=False, default="active")
    start_lat = Column(Float, nullable=True)
    start_lng = Column(Float, nullable=True)
    end_lat = Column(Float, nullable=True)
    end_lng = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    allocation = relationship("BusAllocation")
    driver = relationship("Driver", back_populates="trips")
    bus = relationship("Bus")
    route = relationship("Route")
    attendance_records = relationship("Attendance", back_populates="trip")
    vehicle_reports = relationship("VehicleIssueReport", back_populates="trip")


class FuelRecord(Base):
    __tablename__ = "fuel_records"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="RESTRICT"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False)
    allocation_id = Column(Integer, ForeignKey("bus_allocations.id", ondelete="SET NULL"), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fuel_litres = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False)
    odometer_km = Column(Float, nullable=True)
    fuel_station = Column(String(200), nullable=True)
    receipt_file_path = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bus = relationship("Bus")
    driver = relationship("Driver", back_populates="fuel_records")


class ServiceRecord(Base):
    __tablename__ = "service_records"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="RESTRICT"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False)
    allocation_id = Column(Integer, ForeignKey("bus_allocations.id", ondelete="SET NULL"), nullable=True)
    service_date = Column(DateTime(timezone=True), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    odometer_km = Column(Float, nullable=True)
    service_centre = Column(String(200), nullable=True)
    cost = Column(Float, nullable=True)
    next_service_date = Column(DateTime(timezone=True), nullable=True)
    next_service_km = Column(Float, nullable=True)
    invoice_file_path = Column(String(500), nullable=True)
    status = Column(String(30), nullable=False, default="pending")
    management_approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    bus = relationship("Bus")
    driver = relationship("Driver", back_populates="service_records")


class VehicleIssueReport(Base):
    __tablename__ = "vehicle_issue_reports"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="RESTRICT"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="SET NULL"), nullable=True)
    ticket_number = Column(String(40), nullable=False, unique=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="medium")
    evidence_file_path = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(30), nullable=False, default="open")
    management_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    bus = relationship("Bus")
    driver = relationship("Driver", back_populates="vehicle_reports")
    trip = relationship("Trip", back_populates="vehicle_reports")


class DriverNotification(Base):
    __tablename__ = "driver_notifications"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(String(1000), nullable=False)
    category = Column(String(50), nullable=False, default="general")
    priority = Column(String(30), nullable=False, default="normal")
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    driver = relationship("Driver", back_populates="driver_notifications")
