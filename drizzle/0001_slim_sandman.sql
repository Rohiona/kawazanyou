CREATE TABLE `budget_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_email` text NOT NULL,
	`tax_reserve_percent` real DEFAULT 30 NOT NULL,
	`consumption_tax_percent` real DEFAULT 10 NOT NULL,
	`household_items` text DEFAULT '[]' NOT NULL,
	`payment_items` text DEFAULT '[]' NOT NULL,
	`allocation_items` text DEFAULT '[]' NOT NULL,
	`source` text DEFAULT '手動作成' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_templates_owner_idx` ON `budget_templates` (`owner_email`);