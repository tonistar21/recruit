# АСУ управління військовим рекрутингом «Рекрут+»

Демонстраційний дипломний вебзастосунок для реєстрації, обліку, відбору та супроводу кандидатів. Проєкт використовує лише вигадані дані й не призначений для реальних персональних, медичних або секретних відомостей.

## Можливості

- React-інтерфейс персоналу та окремий кабінет кандидата;
- FastAPI REST API `/api/v1` та development Swagger;
- PostgreSQL, SQLAlchemy 2 і Alembic;
- access/refresh сесії в HttpOnly cookies, CSRF і Argon2id;
- серверний granular RBAC і object-level перевірки;
- кандидати, workflow, приватні документи, співбесіди та сповіщення;
- Dashboard із показниками PostgreSQL;
- append-only аудит із фактичними IP, user-agent і request ID;
- темна/світла тема та адаптивний layout;
- Docker Compose, development seed і API-тести.

## Швидкий запуск

```bash
cp .env.example .env
docker compose -p recruit-plus up --build
```

Відкрийте `http://localhost:3000`. Swagger доступний через backend-контейнер всередині мережі; для ручної backend-розробки — `http://localhost:8000/docs`.

> Параметр `-p recruit-plus` потрібен, бо шлях до проєкту містить кирилицю, з якої Compose не може автоматично сформувати коректне ім’я проєкту.

## Демонстраційні облікові записи

Пароль development seed: `DemoAdmin123!`.

| Роль | Email |
|---|---|
| Адміністратор | `admin@recruit.example.com` |
| Рекрутер | `recruiter1@recruit.example.com` |
| Керівник | `manager@recruit.example.com` |
| Оператор | `operator@recruit.example.com` |
| Кандидат | `candidate1@recruit.example.com` |

Пароль задається змінною `RECRUIT_SEED_ADMIN_PASSWORD`. Не використовуйте development seed у production.

## Ручний запуск

Backend (потрібен PostgreSQL та налаштований `.env`):

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements-dev.txt
cd backend
../.venv/bin/alembic upgrade head
../.venv/bin/python -m app.seed
../.venv/bin/uvicorn app.main:app --reload --port 8000
```

Frontend в іншому терміналі:

```bash
npm ci --prefix frontend
npm run dev --prefix frontend
```

Vite проксіює `/api` на `localhost:8000`.

## Перевірки

```bash
npm run lint
npm run typecheck
npm run test
npm run build
docker compose -p recruit-plus build
npm run test:e2e
```

## Файли та резервне копіювання

Файли зберігаються у приватному `storage/` під UUID-іменами й видаються тільки через авторизований endpoint. Метадані знаходяться у PostgreSQL. Рекомендований backup:

```bash
docker compose -p recruit-plus exec postgres pg_dump -U recruit -Fc recruit > recruit.dump
```

Одночасно копіюйте каталог `storage/`. Фіктивної кнопки резервного копіювання в UI немає.

## Структура

- `frontend/` — React 19, Vite, TypeScript;
- `backend/` — FastAPI, SQLAlchemy, Alembic;
- `docs/` — архітектура, API, безпека та інструкції;
- `storage/` — приватні development-файли;
- `legacy/` — незмінена початкова SPA на `localStorage`.

Поточний фактичний стан і відомі обмеження зафіксовані в [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) та [docs/FINAL_REPORT.md](docs/FINAL_REPORT.md).
