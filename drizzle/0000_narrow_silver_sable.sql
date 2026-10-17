CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "incident_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"user_id" uuid,
	"what_changed" jsonb NOT NULL,
	"reason" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"public_flag" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" text NOT NULL,
	"region" text,
	"district" text,
	"location_precision" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"geom" geometry(point),
	"incident_date" timestamp with time zone NOT NULL,
	"reported_date" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"victim_count_min" integer DEFAULT 1 NOT NULL,
	"victim_count_max" integer,
	"perpetrator_category" text NOT NULL,
	"neutral_summary" text NOT NULL,
	"legal_status" text DEFAULT 'unknown' NOT NULL,
	"verification_level" integer DEFAULT 1 NOT NULL,
	"disputed_flag" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_name" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"raw_text" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hash" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "raw_items_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"url" text NOT NULL,
	"publisher" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"source_type" text DEFAULT 'news_report' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'reviewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "incident_changes" ADD CONSTRAINT "incident_changes_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_changes" ADD CONSTRAINT "incident_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incident_changes_incident_idx" ON "incident_changes" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "incident_changes_public_idx" ON "incident_changes" USING btree ("public_flag");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incidents_country_idx" ON "incidents" USING btree ("country");--> statement-breakpoint
CREATE INDEX "incidents_type_idx" ON "incidents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "incidents_verification_idx" ON "incidents" USING btree ("verification_level");--> statement-breakpoint
CREATE INDEX "incidents_date_idx" ON "incidents" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "incidents_geom_idx" ON "incidents" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "raw_items_status_idx" ON "raw_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "raw_items_hash_idx" ON "raw_items" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "sources_incident_idx" ON "sources" USING btree ("incident_id");