# Схема бази даних

Основні таблиці: `users`, `roles`, `permissions`, `role_permissions`, `refresh_sessions`, `password_reset_tokens`, `candidates`, `workflow_stages`, `candidate_comments`, `candidate_stage_history`, `documents`, `interviews`, `notifications`, `audit_logs`, `system_settings`.

```mermaid
erDiagram
  ROLE ||--o{ USER : assigns
  ROLE }o--o{ PERMISSION : grants
  USER ||--o| CANDIDATE : owns
  USER ||--o{ REFRESH_SESSION : opens
  WORKFLOW_STAGE ||--o{ CANDIDATE : current
  CANDIDATE ||--o{ CANDIDATE_STAGE_HISTORY : changes
  CANDIDATE ||--o{ DOCUMENT : has
  CANDIDATE ||--o{ INTERVIEW : attends
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ AUDIT_LOG : performs
```

Кандидати мають унікальні email, телефон і публічний ID. Файли фізично не зберігаються у БД. Audit log не має update/delete endpoint.
