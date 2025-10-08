CREATE TABLE `user_settings` (
	`user_id` text NOT NULL,
	`email_notifications_level` integer DEFAULT 0 NOT NULL,
	`creation_date` integer NOT NULL,
	`updated_date` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);