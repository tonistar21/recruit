# Безпека

- Argon2id password hash;
- короткоживучий JWT access token та opaque refresh token у HttpOnly cookies;
- hash refresh/reset токенів у БД, відкликання однієї або всіх сесій;
- SameSite=Lax, `Secure` у production-конфігурації;
- double-submit CSRF для змінювальних запитів;
- CORS allowlist, security headers, request ID;
- серверний RBAC та object-level access;
- обмеження розміру, MIME, basename і UUID для файлів;
- ORM-параметризація та React escaping.

Це якісна демонстраційна модель, а не сертифікована військова система. TLS завершується зовнішнім reverse proxy; шифрування PostgreSQL «at rest» цим проєктом не заявляється. Rate limiting auth заявлений у requirements, але middleware ще не підключений — це відоме обмеження.
