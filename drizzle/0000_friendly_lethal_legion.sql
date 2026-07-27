CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `monthly_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`gross_income` integer DEFAULT 0 NOT NULL,
	`tax_reserve_percent` real DEFAULT 30 NOT NULL,
	`consumption_tax_percent` real DEFAULT 10 NOT NULL,
	`household_items` text DEFAULT '[]' NOT NULL,
	`payment_items` text DEFAULT '[]' NOT NULL,
	`allocation_items` text DEFAULT '[]' NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_plans_owner_period_idx` ON `monthly_plans` (`owner_email`,`year`,`month`);