# AI Development Quiz App

Educational quiz platform for AI software development topics — agent design, prompt engineering, workflow automation, and more.

## Stack

- **Frontend:** React, Vite, Chakra UI v3
- **Backend:** Fastify, Prisma, MySQL 8
- **Cache / rate limit:** Redis (`@fastify/rate-limit`, default 5 req/s)
- **Auth:** JWT in httpOnly cookies (SSO-ready for future MFEs)

## Quick start

```bash
cp .env.sample .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web     | http://localhost:5173 |
| API     | http://localhost:3000 |
| MySQL   | localhost:3306 |
| Redis   | localhost:6379 |

On first boot the API runs `prisma db push` and seeds 5 difficulty levels with MCQ + open question pools.

## Environment

Copy [`.env.sample`](.env.sample) to `.env`. Key variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `WEB_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `API_ORIGIN` | `http://localhost:3000` | API base URL |
| `VITE_API_ORIGIN` | `http://localhost:3000` | Frontend API client |
| `RATE_LIMIT_MAX` | `5` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `1000` | Rate limit window (ms) |
| `JWT_ACCESS_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |

## Quiz flow

1. Register / sign in
2. Pick a level (Beginner → Pro)
3. Answer **4 MCQ + 1 open** question
4. Submit → status `PENDING` (no grading at submit time)
5. **Automatic correction:** the `quiz-corrector` worker picks up pending attempts → `IN_CORRECTION` → `CORRECTED`
6. Results page polls until `CORRECTED` (score, general comment, per-question feedback)

The UI **never** receives answer keys (`correctIndex`, `referenceAnswer`).

## API overview

### Auth
- `POST /auth/register` — `{ email, password, displayName? }`
- `POST /auth/login` — `{ email, password }`
- `POST /auth/logout`
- `GET /auth/me`

### Quiz
- `GET /levels`
- `POST /quiz/start` — `{ levelSlug }`
- `POST /quiz/:attemptId/submit` — `{ answers: [{ questionId, selectedIndex?, openText? }] }`
- `GET /quiz/:attemptId/results`
- `POST /quiz/:attemptId/correct` — dev only (403 in production)

### Progress
- `GET /progress`
- `GET /progress/summary`

### Health
- `GET /health` — excluded from rate limiting

## Local development (without Docker)

Requires MySQL and Redis running locally.

```bash
npm install
cp .env.sample .env
# Set DATABASE_URL and REDIS_URL to localhost

npm run build -w @quiz-app/shared
npm run db:generate -w @quiz-app/api
npm run db:migrate:dev -w @quiz-app/api   # or: npx prisma db push
npm run db:seed -w @quiz-app/api

npm run dev:api   # :3000
npm run dev:web   # :5173
```

## Monorepo layout

```
apps/api/          Fastify API + Prisma
apps/web/          React frontend (shell + features/quiz)
packages/shared/   Shared TypeScript DTOs
```

## MFE migration (future)

1. Extract `apps/web/src/features/quiz` → federated remote
2. Keep auth cookies on shared domain (`.localhost`)
3. Backend API unchanged

## License

Private — MVP scaffold.
