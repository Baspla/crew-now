ALTER TABLE `moment` ADD `reminder_sent` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `email_notify_check_in_reminder` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `ntfy_notify_check_in_reminder` integer DEFAULT 0 NOT NULL;