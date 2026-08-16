# Company Tickets — cutover notes

FactoryOS in-app Ticket Center has been retired.

## What changed in factoryos-ui

- Removed `src/features/ticketing`, `src/lib/ticketing-mail`, `/api/ticketing/notification`, and email templates
- `/ticketing` and `/ticketing/my-tasks` now show a move notice
- Sidebar entry renamed to **Company Tickets** and links to `/ticketing` (notice page)

## Soft-launch

1. Deploy `company-tickets` and set a public URL
2. Set `NEXT_PUBLIC_TICKETS_APP_URL` in FactoryOS to that URL
3. Tell employees to use Company Tickets for new requests

Optional open-ticket migration from the old Go ticket API is not automated; export manually if continuity is required.
