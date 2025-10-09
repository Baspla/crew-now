ALTER TABLE `user_settings` ADD `email_notify_daily_moment` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `email_notify_new_posts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `email_comment_scope` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `email_reaction_scope` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` DROP COLUMN `email_notifications_level`;