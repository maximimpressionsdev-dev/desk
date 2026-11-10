-- The ERP's full employee name, shown on tickets next to the EPF number and phone. Set by the ERP directory sync. Additive; safe to re-run.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" varchar(200);
