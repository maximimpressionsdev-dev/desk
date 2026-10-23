-- Allow users without a company email (no more @employee.desk.local placeholders).
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
UPDATE "users" SET "email" = NULL WHERE "email" LIKE '%@employee.desk.local';
