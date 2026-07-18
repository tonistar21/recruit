# Матриця готовності

| Функція | Frontend | Backend/БД | Контроль доступу | Автотести | Статус |
|---|---|---|---|---|---|
| Login/logout/refresh/reset | ✓ | ✓ | HttpOnly, CSRF, Argon2id | pytest + E2E login | Готово |
| Rate limit/lockout | ✓ | ✓ | IP + identifier, Retry-After | pytest 429 | Готово для single instance |
| Roles/settings/users | ✓ | ✓ | granular RBAC | permission-effect + CRUD | Готово |
| Candidates | list/create/detail | CRUD/archive/delete, tags/comments/history | object policy | CRUD/integration | Готово; розширені фільтри доступні в API |
| Documents | upload/review/download/delete | private storage + history | owner/RBAC, MIME/size | lifecycle integration | Готово |
| Workflow | DnD Kanban | guarded transition/history | stages.update | API coverage indirectly | Готово |
| Interviews | calendar/create/update | participants/status/result | owner/RBAC | lifecycle integration | Готово |
| Candidate Cabinet | profile/status/docs/interviews/messages/settings | object isolation | candidate-only routes | isolation test | Готово |
| Dashboard/analytics | metrics/charts/CSV/print | live aggregates/date filters | analytics.read | API integration + E2E dashboard | Готово |
| Search/notifications/audit | ✓ | ✓ | permission-aware/owner | search integration | Готово |
| Error/access states | 403/404/500 boundary | normalized errors | route guards | E2E desktop/mobile | Готово |
| Docker Compose | nginx/FastAPI/PostgreSQL | migrations + seed | secrets via env | image build | Образи готові; локальний daemon не дозволив recreate |
