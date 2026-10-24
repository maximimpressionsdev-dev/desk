-- FactoryOS look: applications (synced from the ERP), the ERP directory link and SMS sign-in codes. Additive; safe to re-run.
CREATE TABLE IF NOT EXISTS "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"link" varchar(300),
	"icon" varchar(60),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "applications_name_uidx" ON "applications" USING btree ("name");
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "application_id" integer;
DO $$ BEGIN
	ALTER TABLE "tickets" ADD CONSTRAINT "tickets_application_id_applications_id_fk"
		FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- The ERP replaces Redis as the source of staff and departments
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "erp_employee" varchar(40);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "erp_user" varchar(140);
CREATE INDEX IF NOT EXISTS "users_erp_employee_idx" ON "users" USING btree ("erp_employee");
CREATE INDEX IF NOT EXISTS "users_erp_user_idx" ON "users" USING btree ("erp_user");
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "erp_name" varchar(140);

-- One-time sign-in codes sent by SMS (hashed; each works once)
CREATE TABLE IF NOT EXISTS "login_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "login_codes_user_created_idx" ON "login_codes" USING btree ("user_id","created_at");
