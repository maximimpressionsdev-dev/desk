# Company Tickets

Standalone internal ticketing / work-request system for any department.

## Stack

- Next.js 16 (App Router) + React 19
- Auth.js (email/password + invites)
- Postgres + Drizzle ORM
- TanStack Query + Tailwind CSS
- Docker Compose

## Quick start

```bash
# Start Postgres
docker compose up -d db

# Install & setup schema + admin seed
npm install
npm run db:setup

# Dev server
npm run dev
```

Default admin (from `.env`):

- Email: `admin@company.local`
- Password: `admin12345`

## App surfaces

- **Inbox** (`/`) — For me / I requested / Queue, with filters, overdue badges, bulk claim/close
- **Ticket sheet** — claim, status, reassign, watch, internal notes, canned replies, links, @mentions
- **Admin** — invites, departments, membership, ticket types, notify email, canned replies

Shortcuts: `N` new ticket · `C` claim open ticket (when sheet is open)

## Cron jobs

Set `CRON_SECRET` in `.env`, then:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron?job=overdue"

curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron?job=digest"
```

- `overdue` — emails assignees/requesters for past-due open tickets
- `digest` — daily summary of open assigned work
- `sync` — pull employees and departments from Redis

## Redis directory

Desk reads `employees` and `departments` from Redis DB 3 and upserts them into Postgres.

```bash
npm run db:sync
```

Staff sign in with company email or employee number (same password hash as Redis). Employees without an email are stored as `{employeeNumber}@employee.desk.local`.

Set in `.env`:

```
REDIS_HOST=159.138.98.55
REDIS_PORT=63790
REDIS_DB=3
```

## Docker (full stack)

```bash
docker compose up --build
```

## FactoryOS cutover

After this app is live, remove Ticket Center from `factoryos-ui` and point users here.

See [docs/CUTOVER.md](docs/CUTOVER.md). FactoryOS now shows a move notice at `/ticketing` and links via `NEXT_PUBLIC_TICKETS_APP_URL`.
