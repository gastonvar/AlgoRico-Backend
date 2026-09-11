---
name: algorico-backend
description: Manage the AlgoRico Express TypeScript backend. Use when implementing backend API features, security fixes, Sequelize models, authorization, auth/session behavior, logging, MinIO/S3 storage, database indexes, or backend tests.
---

# AlgoRico Backend

## Quick Start

1. Inspect the relevant feature folder under `src/features`.
2. Keep the route -> validation -> controller -> service flow.
3. Put ownership, role checks, transactions, and database work in services.
4. Run `npm run lint` after changes.

## Architecture

- Runtime: Express, TypeScript ESM, Sequelize/Postgres.
- Validation: Zod schemas plus `validateBody`, `validateParams`, `validateQuery`.
- Auth: current user from `req.auth!.sub`; never trust client-provided ownership.
- Logging: use `pinoLogger` from `src/lib/pino.ts` and `pino-http` in `src/app.ts`.
- Config: environment is parsed in `src/config/env.ts`.
- Storage: MinIO via S3-compatible API; one client in `src/lib`; Postgres stores object keys.

## Security Rules

- Use `req.auth!.sub` as the current user ID.
- Do not return or log passwords, JWTs, refresh token hashes, secrets, cookies, authorization headers, MinIO keys, or raw sensitive response bodies.
- Add rate limiting to high-risk public/auth endpoints.
- Prefer stable public error messages; log details server-side.

## Data and Performance

- Add indexes for new queries, foreign-key joins, status/date filters, and token hashes.
- Use Sequelize transactions for multi-write operations.
- Avoid raw SQL unless necessary; parameterize when used.
- Keep model associations in `src/models/index.ts`.

## Feature Checklist

- [ ] Zod schema added or updated.
- [ ] Route mounted in `src/app.ts` or feature routes.
- [ ] Controller stays thin.
- [ ] Service enforces authorization.
- [ ] Errors use `AppError` when client-facing.
- [ ] Logs use Pino and contain no secrets.
- [ ] Indexes added when query patterns need them.
- [ ] After adding or changing a migration, run `npm run db:migrate` in `backend/` and wait for it to succeed. Do not only tell the user to migrate.
- [ ] Object storage uses the MinIO/S3 helper, not ad hoc uploads.
- [ ] `npm run lint` passes.
