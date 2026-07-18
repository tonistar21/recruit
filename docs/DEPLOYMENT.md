# Розгортання

Docker Compose запускає `frontend`, `backend`, `postgres`. Backend перед стартом виконує Alembic та idempotent development seed. Storage монтується з `./storage`.

Для production задайте довгий випадковий `RECRUIT_SECRET_KEY`, складний пароль PostgreSQL, `RECRUIT_COOKIE_SECURE=true`, точний CORS origin, TLS reverse proxy та вимкніть development seed/Swagger.
