CREATE TABLE "health_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"note" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
