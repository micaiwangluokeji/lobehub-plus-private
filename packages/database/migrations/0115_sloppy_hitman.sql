
CREATE TABLE IF NOT EXISTS "credit_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"price_per_credit" numeric(10, 4) DEFAULT 0.01,
	"min_top_up_amount" numeric(10, 2) DEFAULT 1,
	"max_top_up_amount" numeric(10, 2) DEFAULT 9999,
	"bonus_rate" numeric(5, 2) DEFAULT 0,
	"credit_expiry_days" integer DEFAULT 365,
	"referral_reward_credits" integer DEFAULT 0,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"wechat" jsonb DEFAULT '{"enabled":false}'::jsonb,
	"alipay" jsonb DEFAULT '{"enabled":false}'::jsonb,
	"currency" varchar(3) DEFAULT 'CNY',
	"payment_timeout" integer DEFAULT 30,
	"notify_url" varchar(512),
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"monthly_credits" integer DEFAULT 0 NOT NULL,
	"personal_budget" numeric(15, 2) DEFAULT 0,
	"workspace_budget" numeric(15, 2) DEFAULT 0,
	"billing_cycle" varchar(16) DEFAULT 'monthly' NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"enabled" boolean DEFAULT true,
	"sort" integer DEFAULT 0,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
