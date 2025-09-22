PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_moment` (
	`id` text PRIMARY KEY NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer
);
--> statement-breakpoint
INSERT INTO `__new_moment`("id", "start_date", "end_date") SELECT "id", "start_date", "end_date" FROM `moment`;--> statement-breakpoint
DROP TABLE `moment`;--> statement-breakpoint
ALTER TABLE `__new_moment` RENAME TO `moment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;