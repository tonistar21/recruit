# Changelog

## 2026-07-16

- Проведено аудит початкової SPA.
- Статичну реалізацію збережено в `legacy/`.
- Створено план контрольованої міграції та початкові ADR.
- Додано FastAPI, PostgreSQL-модель, Alembic та development seed.
- Реалізовано cookie auth, CSRF, RBAC, аудит і object-level access.
- Додано React layouts персоналу/кандидата та PostgreSQL Dashboard.
- Додано Docker Compose і базові автоматичні тести.
- Додано `COMPLETION_PLAN.md` на основі повторного аудиту API та React routes.
- Реалізовано auth rate limiting з 429/Retry-After і тестом.
- Додано roles/permissions API, захист admin role та тест фактичного впливу permission на API.
- Додано робочі React-сторінки матриці ролей і особистих/системних налаштувань.
- Додано candidate comments/history та guarded permanent-delete API.
- Backend suite розширено до 9 тестів.
- Завершено candidates CRUD/detail, comments, tags, history, archive/restore/delete і розширені API-фільтри.
- Завершено documents review/history/download/delete та candidate-owned upload UI.
- Додано dnd-kit Kanban з optimistic update/rollback і календар співбесід зі status/result API.
- Реалізовано users, audit, global search, notifications, розширену analytics та Candidate Cabinet.
- Додано 403/404/500 states, Error Boundary і permission route guards.
- Системні access-token/lockout параметри підключено до auth runtime.
- Backend suite розширено до 13 тестів; додано Playwright desktop/mobile suite (4 passed).
- Успішно зібрано актуальні Docker-образи; runtime recreate заблокований дозволами локального Docker daemon.
