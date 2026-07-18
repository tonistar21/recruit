from datetime import date, timedelta

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Candidate, CandidateStageHistory, Interview, Notification, Permission, Role, SystemSetting, User, WorkflowStage

PERMISSIONS = {
    "candidates.read": "Перегляд кандидатів", "candidates.create": "Створення кандидатів", "candidates.update": "Редагування кандидатів",
    "candidates.archive": "Архівування кандидатів", "candidates.delete": "Остаточне видалення", "candidates.export": "Експорт кандидатів",
    "documents.read": "Перегляд документів", "documents.upload": "Завантаження документів", "documents.verify": "Перевірка документів",
    "stages.update": "Зміна етапів", "interviews.manage": "Керування співбесідами", "analytics.read": "Перегляд аналітики",
    "users.manage": "Керування користувачами", "roles.manage": "Керування ролями", "audit.read": "Перегляд аудиту",
    "settings.manage": "Системні налаштування", "own_profile.read": "Власний профіль", "own_profile.update": "Оновлення власного профілю",
}
ROLE_PERMISSIONS = {
    "admin": list(PERMISSIONS),
    "recruiter": ["candidates.read", "candidates.create", "candidates.update", "candidates.archive", "candidates.export", "documents.read", "documents.upload", "documents.verify", "stages.update", "interviews.manage", "analytics.read"],
    "manager": ["candidates.read", "candidates.export", "documents.read", "stages.update", "analytics.read", "audit.read"],
    "operator": ["candidates.read", "candidates.create", "candidates.update", "documents.read", "documents.upload"],
    "candidate": ["candidates.read", "candidates.update", "documents.read", "documents.upload", "own_profile.read", "own_profile.update"],
}
ROLE_NAMES = {"admin": "Адміністратор", "recruiter": "Рекрутер", "manager": "Керівник", "operator": "Оператор", "candidate": "Кандидат"}
STAGES = [
    ("new", "Новий кандидат"), ("profile_complete", "Анкету заповнено"), ("documents", "Перевірка документів"),
    ("screening", "Первинний розгляд"), ("interview", "Співбесіда"), ("testing", "Тестування"),
    ("manager_decision", "Рішення керівника"), ("recommended", "Рекомендовано"), ("accepted", "Прийнято"),
    ("rejected", "Відхилено"), ("archived", "Архів"),
]


def run_seed() -> None:
    with SessionLocal() as db:
        if db.scalar(select(Role.id).limit(1)):
            print("Seed already applied")
            return
        permission_map = {code: Permission(code=code, description=description) for code, description in PERMISSIONS.items()}
        db.add_all(permission_map.values())
        db.flush()
        roles = {}
        for code, name in ROLE_NAMES.items():
            role = Role(code=code, name=name, permissions=[permission_map[p] for p in ROLE_PERMISSIONS[code]])
            roles[code] = role
            db.add(role)
        stages = []
        for position, (code, name) in enumerate(STAGES, 1):
            stage = WorkflowStage(code=code, name=name, position=position, terminal=code in {"accepted", "rejected", "archived"})
            stages.append(stage)
            db.add(stage)
        db.flush()
        password = hash_password(settings.seed_admin_password)
        accounts = [
            ("admin@recruit.example.com", "Майор Олена Петренко", "admin"), ("recruiter1@recruit.example.com", "Капітан Сергій Іваненко", "recruiter"),
            ("recruiter2@recruit.example.com", "Лейтенант Марія Коваль", "recruiter"), ("manager@recruit.example.com", "Полковник Андрій Бондар", "manager"),
            ("operator@recruit.example.com", "Старшина Ірина Мельник", "operator"),
        ]
        users = {}
        for email, name, role_code in accounts:
            user = User(email=email, display_name=name, role_id=roles[role_code].id, password_hash=password)
            db.add(user)
            users[role_code + email] = user
        db.flush()
        candidates_data = [
            ("Олександр", "Коваленко", "Олександрович", "candidate1@recruit.example.com", "+380671110001", 0, "Київ", "Кібербезпека"),
            ("Марія", "Сидоренко", "Іванівна", "candidate2@recruit.example.com", "+380671110002", 2, "Львів", "Тактична медицина"),
            ("Дмитро", "Мельник", "Сергійович", "candidate3@recruit.example.com", "+380671110003", 4, "Одеса", "Радіозв'язок"),
            ("Ірина", "Шевченко", "Петрівна", "candidate4@recruit.example.com", "+380671110004", 5, "Дніпро", "Логістика"),
            ("Максим", "Бондаренко", "Олегович", "candidate5@recruit.example.com", "+380671110005", 7, "Черкаси", "БПЛА"),
        ]
        recruiter = users["recruiterrecruiter1@recruit.example.com"]
        for index, row in enumerate(candidates_data, 1):
            first, last, middle, email, phone, stage_index, city, speciality = row
            candidate_user = None
            if index == 1:
                candidate_user = User(email=email, display_name=f"{last} {first}", role_id=roles["candidate"].id, password_hash=password)
                db.add(candidate_user)
                db.flush()
            candidate = Candidate(public_id=f"C-{1000 + index}", user_id=candidate_user.id if candidate_user else None, first_name=first, last_name=last, middle_name=middle, birth_date=date(1990 + index, index, min(10 + index, 28)), phone=phone, email=email, city=city, region=f"{city}ська", speciality=speciality, desired_direction="Сили оборони", source="Рекрутинговий центр", recruiter_id=recruiter.id, stage_id=stages[stage_index].id, status="new" if stage_index == 0 else "in_progress")
            db.add(candidate)
            db.flush()
            db.add(CandidateStageHistory(candidate_id=candidate.id, to_stage_id=stages[stage_index].id, author_id=recruiter.id, comment="Демонстраційний запис"))
            if candidate_user:
                db.add(Notification(user_id=candidate_user.id, type="system", title="Вітаємо у «Рекрут+»", message="Ваш кабінет кандидата активовано", link="/cabinet"))
                db.add(Interview(candidate_id=candidate.id, responsible_id=recruiter.id, starts_at=__import__("datetime").datetime.now(__import__("datetime").UTC) + timedelta(days=3), format="online", meeting_url="https://meet.example.test/demo"))
        db.add_all([SystemSetting(key="system_name", value="АСУ Рекрут+"), SystemSetting(key="max_upload_mb", value="10")])
        db.commit()
        print("Development seed applied")


if __name__ == "__main__":
    run_seed()
