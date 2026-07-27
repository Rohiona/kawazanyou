UPDATE `budget_templates`
SET
	`tax_reserve_percent` = 30,
	`consumption_tax_percent` = 10,
	`allocation_items` = '[]'
WHERE
	`source` = '皮算用_2026.xlsx 2026年7月'
	AND `updated_at` = '2026-07-27T00:00:00.000Z';
