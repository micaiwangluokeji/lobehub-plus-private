CREATE TABLE "content_moderation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"content_type" varchar(50) NOT NULL,
	"content_id" uuid,
	"moderation_result" varchar(20) NOT NULL,
	"risk_score" text,
	"flagged_tags" text[],
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_health_checks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"response_time" integer,
	"error_message" text,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
