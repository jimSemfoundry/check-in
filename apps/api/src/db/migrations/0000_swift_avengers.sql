CREATE TYPE "public"."action_type" AS ENUM('feed', 'play');--> statement-breakpoint
CREATE TYPE "public"."currency_type" AS ENUM('food');--> statement-breakpoint
CREATE TYPE "public"."frequency_type" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."pet_event_type" AS ENUM('feed', 'play', 'rename', 'level_up', 'evolve');--> statement-breakpoint
CREATE TYPE "public"."reward_source_type" AS ENUM('checkin', 'feed', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'participant');--> statement-breakpoint
CREATE TABLE "anonymous_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"token_hash" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_habit_plans" (
	"workspace_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"plan_date" date NOT NULL,
	"habit_name_snapshot" text NOT NULL,
	"icon_snapshot" text NOT NULL,
	"target_count_snapshot" integer NOT NULL,
	"target_unit_snapshot" text,
	CONSTRAINT "daily_habit_plans_workspace_id_habit_id_plan_date_pk" PRIMARY KEY("workspace_id","habit_id","plan_date")
);
--> statement-breakpoint
CREATE TABLE "game_action_configs" (
	"action_type" "action_type" PRIMARY KEY NOT NULL,
	"food_cost" integer NOT NULL,
	"experience_gain" integer NOT NULL,
	"intimacy_gain" integer NOT NULL,
	"cooldown_seconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"habit_id" uuid NOT NULL,
	"checkin_date" date NOT NULL,
	"completed_by_session_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "habit_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"local_time" time
);
--> statement-breakpoint
CREATE TABLE "habit_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"weekday" smallint,
	"times_per_week" smallint,
	"month_day" smallint
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"target_count" integer NOT NULL,
	"target_unit" text,
	"frequency_type" "frequency_type" NOT NULL,
	"start_date" date NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"event_type" "pet_event_type" NOT NULL,
	"actor_session_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_level_configs" (
	"species_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"required_experience" integer NOT NULL,
	"growth_stage" text NOT NULL,
	CONSTRAINT "pet_level_configs_species_id_level_pk" PRIMARY KEY("species_id","level")
);
--> statement-breakpoint
CREATE TABLE "pet_species" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"rarity" text NOT NULL,
	"asset_key" text NOT NULL,
	CONSTRAINT "pet_species_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"species_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"experience" integer DEFAULT 0 NOT NULL,
	"intimacy" integer DEFAULT 0 NOT NULL,
	"growth_stage" text NOT NULL,
	"last_played_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"currency_type" "currency_type" DEFAULT 'food' NOT NULL,
	"source_type" "reward_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"actor_session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_access_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"key_hash" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Bangkok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anonymous_sessions" ADD CONSTRAINT "anonymous_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_habit_plans" ADD CONSTRAINT "daily_habit_plans_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_habit_plans" ADD CONSTRAINT "daily_habit_plans_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_checkins" ADD CONSTRAINT "habit_checkins_completed_by_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("completed_by_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_reminders" ADD CONSTRAINT "habit_reminders_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_schedules" ADD CONSTRAINT "habit_schedules_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_events" ADD CONSTRAINT "pet_events_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_events" ADD CONSTRAINT "pet_events_actor_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("actor_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_level_configs" ADD CONSTRAINT "pet_level_configs_species_id_pet_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."pet_species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_species_id_pet_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."pet_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_ledger" ADD CONSTRAINT "reward_ledger_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_ledger" ADD CONSTRAINT "reward_ledger_actor_session_id_anonymous_sessions_id_fk" FOREIGN KEY ("actor_session_id") REFERENCES "public"."anonymous_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_access_keys" ADD CONSTRAINT "workspace_access_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anonymous_sessions_token_hash_uidx" ON "anonymous_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "anonymous_sessions_workspace_idx" ON "anonymous_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "daily_habit_plans_workspace_date_idx" ON "daily_habit_plans" USING btree ("workspace_id","plan_date");--> statement-breakpoint
CREATE INDEX "habit_checkins_workspace_date_idx" ON "habit_checkins" USING btree ("workspace_id","checkin_date");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_checkins_active_uidx" ON "habit_checkins" USING btree ("workspace_id","habit_id","checkin_date") WHERE "habit_checkins"."cancelled_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_reminders_habit_uidx" ON "habit_reminders" USING btree ("habit_id");--> statement-breakpoint
CREATE INDEX "habits_workspace_idx" ON "habits" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "pet_events_pet_idx" ON "pet_events" USING btree ("pet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pets_workspace_uidx" ON "pets" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "reward_ledger_workspace_idx" ON "reward_ledger" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_ledger_source_uidx" ON "reward_ledger" USING btree ("workspace_id","source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_access_keys_hash_uidx" ON "workspace_access_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "workspace_access_keys_workspace_idx" ON "workspace_access_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_uidx" ON "workspaces" USING btree ("slug");