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

- **My requests** — tickets you filed
- **My work** — tickets assigned to you
- **Queues** — department agent queues
- **New request** — submit to any department
- **Admin** — invites, departments, membership, ticket types

## Docker (full stack)

```bash
docker compose up --build
```

## FactoryOS cutover

After this app is live, remove Ticket Center from `factoryos-ui` and point users here.
