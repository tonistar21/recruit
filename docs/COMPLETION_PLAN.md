# План завершення

Аудит від 2026-07-16 зіставив 35 backend routes із React-викликами. API auth, candidates, documents, interviews, notifications, analytics, audit і search існують, але React використовує лише read-flow кандидатів, Dashboard, read-only Kanban, документи/співбесіди у технічному JSON-вигляді. `UsersPage`, `RolesPage`, `AnalyticsPage`, `AuditPage`, `SettingsPage` та частина Candidate Cabinet є placeholder-компонентами.

## Виявлені розриви

1. Candidates: немає create/edit/detail/archive UI, tags/comments/history API, delete endpoint і розширених фільтрів.
2. Documents: немає update/delete/status history API та повного upload/review UI.
3. Workflow: немає DnD, history read endpoint і діалогів значимих переходів.
4. Interviews: є лише list/create API, відсутні update/status/participants і календар UI.
5. Roles/settings: endpoints і робочий UI відсутні.
6. Global search API не підключений до topbar і шукає лише кандидатів.
7. Dashboard повертає лише частину необхідної аналітики.
8. Candidate Cabinet містить статичні `65%` та placeholder routes.
9. Auth rate limiting не підключений.
10. Немає Playwright, Error Boundary, окремих 403/404/backend unavailable сторінок.

## Послідовність вертикальних етапів

1. Auth rate limiting, roles/settings API, тести фактичної зміни permission.
2. Повний candidates backend і React CRUD зі схемами React Hook Form/Zod.
3. Documents CRUD/review/history та candidate-owned UI.
4. Workflow history і dnd-kit Kanban з rollback.
5. Interviews CRUD/status/calendar.
6. Roles matrix, users і settings UI.
7. Global search, notifications, audit та розширена analytics UI.
8. Завершення Candidate Cabinet та object-isolation tests.
9. Error/403/404 states, responsive audit і accessibility.
10. Playwright, clean database reset, Docker acceptance та фінальна документація.

Кожен етап завершується Ruff, pytest, ESLint, TypeScript, Vitest і production build. Статус не змінюється на completed без фактичної перевірки.
