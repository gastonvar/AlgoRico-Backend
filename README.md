# Algo Rico Backend

Private REST API for the Algo Rico pastry business. It replaces a paper customer/order agenda: clients, conversation history, screenshot attachments, orders, payments, tasks, calendar, and an action-oriented dashboard.

The frontend is a separate React application. This service authenticates with HTTP-only session cookies and stores files in MinIO through its S3-compatible API.

## Stack

- Node.js 20+
- Express and TypeScript
- PostgreSQL and Sequelize (schema from migrations only)
- Zod validation
- Pino logging
- MinIO via `@aws-sdk/client-s3`

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start PostgreSQL and MinIO (Compose project `algorico`, containers `*-algorico`). Postgres is on host port **5433**:

```bash
docker compose up -d
```

3. Install dependencies, migrate, seed, and run:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Development login (Algo Rico tenant, owns all seeded demo data):

- Email: `victoriavanoli@hotmail.com`
- Password: `AlgoRicoDev1!`

Migrations also provision the two Arome tenant accounts (`antonelita260107@gmail.com`
and `hallerjanire8@gmail.com`) with temporary passwords set in
`src/database/migrations/010-arome-users.ts`. They start with no data; anything
they create is scoped to the Arome company.

## Tests

```bash
npm run test
```

Unit tests always run. HTTP integration tests apply migrations against `algorico_test` and need PostgreSQL. With Docker:

```bash
docker compose up -d
```

Then set `DATABASE_URL=postgres://algorico:algorico@localhost:5433/algorico_test` when running tests, or keep the default from `tests/setup-env.ts`. Postgres is published on host port **5433** so it does not collide with QRly on 5432.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API with reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run the compiled API |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run db:migrate` | Apply Sequelize migrations |
| `npm run db:seed` | Insert development data |

## Architecture

Feature folders under `src/features` follow `routes -> validation -> controller -> service`. Sequelize models live in `src/models`. Migrations are in `src/database/migrations` and are the only schema source; `sequelize.sync()` is not used.

## Authentication

Sessions are stored server-side. Login sets:

- `algorico.sid` — HTTP-only session cookie
- `algorico.csrf` — readable CSRF cookie

Mutating `/api/*` business requests must send `x-csrf-token`. Passwords are hashed with bcrypt. Login is rate-limited.

## Attachments

Screenshots are stored in MinIO under `companies/{companyId}/...`. PostgreSQL stores metadata and the object key. Download URLs are short-lived and generated only after authentication. Existing files keep their original keys.

## API documentation

See [docs/API.md](docs/API.md).
