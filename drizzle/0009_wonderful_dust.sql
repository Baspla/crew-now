ALTER TABLE `user_settings` ADD `ntfy_notify_daily_moment` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ntfy_notify_new_posts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ntfy_comment_scope` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ntfy_reaction_scope` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `ntfy_topic` text;