CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source" varchar(50),
	"reference_id" text,
	"reference_type" varchar(50),
	"description" text,
	"operator_id" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"plan_id" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"billing_cycle" varchar(20) DEFAULT 'month' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"canceled_at" timestamp with time zone,
	"cancel_reason" text,
	"payment_provider" varchar(50),
	"payment_subscription_id" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spend_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"session_id" text,
	"model_id" varchar(150),
	"model_name" varchar(100),
	"provider_id" varchar(64),
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"input_cost" numeric(12, 2) DEFAULT 0 NOT NULL,
	"output_cost" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT 0 NOT NULL,
	"credits_consumed" integer DEFAULT 0 NOT NULL,
	"price_per_credit" numeric(12, 4),
	"duration_ms" integer,
	"status" varchar(20) DEFAULT 'success' NOT NULL,
	"error_message" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_logs" ADD CONSTRAINT "spend_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_logs" ADD CONSTRAINT "spend_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend_logs" ADD CONSTRAINT "spend_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_transactions_user_id_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "spend_logs_user_id_idx" ON "spend_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spend_logs_workspace_id_idx" ON "spend_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "spend_logs_created_at_idx" ON "spend_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "spend_logs_model_id_idx" ON "spend_logs" USING btree ("model_id");