-- Cancelling a ticket (instead of resolving it) needs a reason. Additive; safe to re-run.
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "cancel_reason" text;
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
