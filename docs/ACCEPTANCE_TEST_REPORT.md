# Звіт приймальних перевірок

Дата: 2026-07-16.

| Перевірка | Фактично | Статус | Примітка |
|---|---|---|---|
| ESLint + Ruff | 0 errors | Пройдено | `npm run lint` |
| Strict TypeScript | 0 errors | Пройдено | `npm run typecheck` |
| Vitest | 1 passed | Пройдено | API client unit smoke |
| Backend API | 13 passed | Пройдено | auth/RBAC/settings/candidates/documents/interviews/users/search/analytics |
| Production build | dist generated | Пройдено | є chunk-size warning |
| Permission effect | 403 до, 200 після | Пройдено | реальна server-side зміна |
| Rate limit | 429 + Retry-After | Пройдено | in-memory single instance |
| Playwright desktop Chromium | 2 passed | Пройдено | login/dashboard/403/404 |
| Playwright mobile Chromium | 2 passed | Пройдено | Pixel 7 viewport |
| Docker config/build | backend + frontend images built | Пройдено | актуальний source tree |
| Docker runtime recreate | daemon permission denied | Заблоковано | старий backend container неможливо зупинити |
