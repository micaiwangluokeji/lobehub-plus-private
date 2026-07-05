CREATE TABLE IF NOT EXISTS "chat_group_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_group_id" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"user_view_count" integer DEFAULT 0 NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_group_shares" ADD CONSTRAINT "chat_group_shares_chat_group_id_chat_groups_id_fk" FOREIGN KEY ("chat_group_id") REFERENCES "public"."chat_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chat_group_shares_chat_group_id_unique" ON "chat_group_shares" USING btree ("chat_group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_group_shares_visibility_idx" ON "chat_group_shares" USING btree ("visibility");
