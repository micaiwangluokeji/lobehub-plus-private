CREATE TABLE "dict_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(128) NOT NULL,
	"value" jsonb NOT NULL,
	"label" varchar(256) NOT NULL,
	"group" varchar(64) DEFAULT 'general' NOT NULL,
	"type" varchar(16) DEFAULT 'string' NOT NULL,
	"sort" integer DEFAULT 0,
	"description" text,
	"enabled" boolean DEFAULT true,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dict_configs_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"used_by_user_id" text,
	"used_at" timestamp with time zone,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "membership_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"slug" varchar(32) NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"min_recharge_total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"monthly_credits_bonus" integer DEFAULT 0,
	"storage_bonus_mb" integer DEFAULT 0,
	"features" jsonb DEFAULT '[]'::jsonb,
	"icon" varchar(64),
	"color" varchar(16),
	"enabled" boolean DEFAULT true,
	"sort" integer DEFAULT 0,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_levels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"prepay_id" varchar(64),
	"transaction_id" varchar(64),
	"wx_code_url" varchar(512),
	"wx_h5_url" varchar(512),
	"paid_at" timestamp with time zone,
	"expired_at" timestamp with time zone NOT NULL,
	"refund_status" varchar(20),
	"refund_amount" numeric(10, 2),
	"description" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewer_id" text,
	"review_note" text,
	"wx_refund_id" varchar(64),
	"processed_at" timestamp with time zone,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "membership_level_id" text;--> statement-breakpoint
ALTER TABLE "credit_configs" ADD COLUMN "default_registration_credits" integer DEFAULT 500;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_payment_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payment_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invite_codes_user_id_idx" ON "invite_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invite_codes_code_idx" ON "invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_orders_status_idx" ON "payment_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_orders_prepay_id_idx" ON "payment_orders" USING btree ("prepay_id");--> statement-breakpoint
CREATE INDEX "refund_requests_user_id_idx" ON "refund_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refund_requests_order_id_idx" ON "refund_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refund_requests_status_idx" ON "refund_requests" USING btree ("status");