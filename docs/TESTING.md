# Тестування

Повний локальний quality gate:

```bash
npm ci --prefix frontend
npm run check
npx --prefix frontend playwright install chromium
npm run test:e2e
docker compose -p recruit-plus config --quiet
docker compose -p recruit-plus build
```

`npm run check` запускає ESLint, Ruff, strict TypeScript, Vitest, 13 FastAPI/SQLAlchemy integration-тестів і production build. Playwright окремо запускає login/dashboard та 403/404 сценарії у desktop Chromium і мобільному Pixel 7 viewport; API для UI smoke-тестів детерміновано перехоплюється, а реальний backend перевіряється pytest suite.

Для повного runtime acceptance після доступу до Docker daemon: `docker compose -p recruit-plus up -d --build --wait`, потім `curl http://localhost:3000/api/v1/health`.
