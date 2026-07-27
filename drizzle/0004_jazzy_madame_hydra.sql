ALTER TABLE `budget_templates` ADD `simplified_tax_category` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `monthly_plans` ADD `simplified_tax_category` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
UPDATE `budget_templates` SET `consumption_tax_percent` = 10;--> statement-breakpoint
UPDATE `monthly_plans` SET `consumption_tax_percent` = 10;
