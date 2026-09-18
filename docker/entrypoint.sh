#!/bin/sh
set -eu

echo "Waiting for PostgreSQL..."
node --input-type=module <<'NODE'
import net from 'node:net';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const parsed = new URL(url);
const host = parsed.hostname;
const port = Number(parsed.port || 5432);
const deadline = Date.now() + 60_000;

function attempt() {
  const socket = net.connect({ host, port }, () => {
    socket.end();
    console.log(`PostgreSQL is reachable at ${host}:${port}`);
    process.exit(0);
  });
  socket.on('error', () => {
    socket.destroy();
    if (Date.now() > deadline) {
      console.error('Timed out waiting for PostgreSQL');
      process.exit(1);
    }
    setTimeout(attempt, 1000);
  });
}

attempt();
NODE

echo "Running migrations..."
npx tsx src/database/migrator.ts up

if [ -n "${OWNER_EMAIL:-}" ] && [ -n "${OWNER_PASSWORD:-}" ]; then
  echo "Ensuring owner user exists..."
  npx tsx src/database/create-owner.ts
fi

echo "Starting API..."
exec node dist/server.js
