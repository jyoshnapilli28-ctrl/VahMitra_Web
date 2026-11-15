import sys
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models import User, Student, Driver, Route, Bus, BusAllocation, StudentRouteAssignment
from app.security import hash_password

def seed_demo_users():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        print("Seeding demo accounts for VAHMITRA...")

        # 1. Management User
        admin_user = db.query(User).filter(User.username == "srmap@vahmitra").first()
        if not admin_user:
            admin_user = User(
                username="srmap@vahmitra",
                password_hash=hash_password("AdminPassword123!"),
                role="management",
                is_active=True
            )
            db.add(admin_user)
            print("✓ Created Management account: srmap@vahmitra / AdminPassword123!")
        else:
            admin_user.password_hash = hash_password("AdminPassword123!")
            print("✓ Updated Management account: srmap@vahmitra / AdminPassword123!")

        # 2. Driver User
        driver_user = db.query(User).filter(User.username == "driver_srmap").first()
        if not driver_user:
            driver_user = User(
                username="driver_srmap",
                password_hash=hash_password("DriverPassword123!"),
                role="driver",
                is_active=True
            )
            db.add(driver_user)
            db.flush()
            print("✓ Created Driver user account: driver_srmap / DriverPassword123!")
        else:
            driver_user.password_hash = hash_password("DriverPassword123!")
            print("✓ Updated Driver user account: driver_srmap / DriverPassword123!")

        driver_record = db.query(Driver).filter(Driver.user_id == driver_user.id).first()
        if not driver_record:
            driver_record = Driver(
                user_id=driver_user.id,
                driver_name="Ramesh Kumar",
                phone="+91 98480 12345",
                license_number="AP16-2021-009876"
            )
            db.add(driver_record)
            print("✓ Associated Driver profile: Ramesh Kumar")

        # 3. Student User
        student_user = db.query(User).filter(User.username == "student_srmap").first()
        if not student_user:
            student_user = User(
                username="student_srmap",
                password_hash=hash_password("StudentPassword123!"),
                role="student",
                is_active=True
            )
            db.add(student_user)
            db.flush()
            print("✓ Created Student user account: student_srmap / StudentPassword123!")
        else:
            student_user.password_hash = hash_password("StudentPassword123!")
            print("✓ Updated Student user account: student_srmap / StudentPassword123!")

        reg_no = "AP24110010568"
        student_record = db.query(Student).filter(Student.registration_number == reg_no).first()
        if not student_record:
            student_record = Student(
                user_id=student_user.id,
                registration_number=reg_no,
                full_name="Deepak Sunkara",
                nickname="Deepak",
                email="deepak_sunkara@srmap.edu.in",
                phone="+91 91234 56789",
                department="Computer Science & Engineering",
                academic_year="AY 2024-2028"
            )
            db.add(student_record)
            print(f"✓ Associated Student profile: {reg_no} / Deepak Sunkara")
        else:
            student_record.user_id = student_user.id
            if not student_record.nickname:
                student_record.nickname = "Deepak"
            print(f"✓ Linked Student profile: {reg_no} / {student_record.full_name}")

        # Ensure demo route exists
        route = db.query(Route).filter(Route.route_code == "G-9").first()
        if not route:
            route = Route(
                area="Guntur",
                route_code="G-9",
                route_name="Guntur — Vidyanagar Line",
                start_point="Vidyanagar 1st Line",
                end_point="SRM University AP",
                is_active=True
            )
            db.add(route)
            db.flush()

        # Ensure demo bus exists
        bus = db.query(Bus).filter(Bus.bus_number == "12").first()
        if not bus:
            bus = Bus(
                bus_number="12",
                registration_number="AP 16 TZ 4512",
                capacity=54,
                is_active=True
            )
            db.add(bus)
            db.flush()

        # Ensure driver allocation exists
        if driver_record:
            allocation = db.query(BusAllocation).filter(
                BusAllocation.driver_id == driver_record.id,
                BusAllocation.status == "active"
            ).first()
            if not allocation:
                allocation = BusAllocation(
                    bus_id=bus.id,
                    driver_id=driver_record.id,
                    route_id=route.id,
                    start_date=now,
                    status="active"
                )
                db.add(allocation)
                print("✓ Created Demo Bus Allocation (Bus #12 on Route G-9)")

        # Ensure student route assignment exists
        if student_record:
            assignment = db.query(StudentRouteAssignment).filter(
                StudentRouteAssignment.student_id == student_record.id,
                StudentRouteAssignment.status == "active"
            ).first()
            if not assignment:
                assignment = StudentRouteAssignment(
                    student_id=student_record.id,
                    route_id=route.id,
                    start_date=now,
                    status="active"
                )
                db.add(assignment)
                print("✓ Assigned student to Route G-9")

        db.commit()
        print("\nAll demo credentials seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Notice during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_users()

