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

# Install & setup schema + seed
npm install
npm run db:setup
npm run db:sync

# Dev server
npm run dev
```

Staff sign in with their username or EPF number and password/NIC, their ERP login, or a code by SMS (see below). Run `npm run db:sync` to refresh staff and departments from the ERP.

## App surfaces

- **Inbox** (`/`) — For me / My Tickets / Queue, with filters, overdue badges, bulk claim/close
- **Ticket sheet** — claim, status, reassign, watch, internal notes, canned replies, links, @mentions
- **Admin** — invites, departments, membership, ticket types, notify email, canned replies

Shortcuts: `N` new ticket

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
- `sync` — refresh staff and departments from the ERP
- `apps` — refresh the FactoryOS application list from the ERP

## ERP directory and applications

Staff, departments and the FactoryOS application list come from the company ERP (Frappe): `Employee`, `Department` and `Maxim App`.

```bash
npm run db:sync   # staff and departments (also Admin → Company directory → Sync from ERP)
```

The sync adds and updates but never removes: new departments arrive switched off, new people start in their ERP department's queue, existing queues are never changed by the sync, and nobody is deactivated for being missing from the ERP. The application list refreshes itself once a day (or Admin → Applications → Sync from ERP).

Set in `.env`:

```
FRAPPE_URL=https://erp.example.com
FRAPPE_API_KEY=
FRAPPE_API_SECRET=
```

## Signing in

One page, three ways:

- **Username or EPF number + desk password or ID number (NIC)**, as before.
- **ERP email + ERP password**, for staff with an ERP login (checked against the ERP).
- **EPF number + a code by SMS** to the mobile number from the ERP (10 minutes, 5 tries, 1 a minute, 5 an hour).

## New ticket links

`/?new=1&app=<app>&department=<name or code>&issue=<main issue>&reason=<sub issue>` opens the new ticket form filled in;
each part is optional. FactoryOS's Help button uses it: `app` is the app's name (or its path, e.g. `employee-pass`).
Picking an application sends the ticket to `NEXT_PUBLIC_APPS_DEPARTMENT` (default `IT`) under `NEXT_PUBLIC_APPS_ISSUE`
(default `Systems & Applications`).

## Docker (full stack)

```bash
docker compose up --build
```

## FactoryOS cutover

After this app is live, remove Ticket Center from `factoryos-ui` and point users here.

See [docs/CUTOVER.md](docs/CUTOVER.md). FactoryOS now shows a move notice at `/ticketing` and links via `NEXT_PUBLIC_TICKETS_APP_URL`.
