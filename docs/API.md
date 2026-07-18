# REST API

Префікс: `/api/v1`. OpenAPI: `/docs` у development.

- `auth`: login, me, refresh, logout, logout-all, зміна/відновлення пароля;
- `users`: список, створення, блокування;
- `candidates`: пагінація, пошук, CRUD, архів, workflow, CSV;
- `documents`: список, upload, авторизоване скачування;
- `interviews`: список і створення;
- `notifications`: список і read state;
- `analytics/dashboard`: агрегати PostgreSQL;
- `audit`: append-only журнал;
- `search`: permission-aware пошук;
- `health`: health check.
- `roles`, `permissions`: матриця та зміна прав;
- `settings/system`, `settings/profile`: діючі системні й особисті параметри;
- candidate `comments`, `history`, guarded permanent delete.

Помилки валідації повертаються як `{"error":{"code","message","details"}}`. Частина стандартних HTTP-помилок FastAPI поки повертає поле `detail`; уніфікація всіх винятків зазначена як незавершена.
