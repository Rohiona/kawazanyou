UPDATE `budget_templates`
SET `allocation_items` = '[{"id":"destination-tax","name":"税金用","amount":0},{"id":"destination-bills","name":"引落用","amount":0},{"id":"destination-living","name":"生活費用","amount":0},{"id":"destination-savings","name":"貯蓄用","amount":0},{"id":"destination-reserve","name":"予備","amount":0},{"id":"destination-cash","name":"現金","amount":0},{"id":"destination-investment","name":"投資用","amount":0}]'
WHERE
	`source` = '皮算用_2026.xlsx 2026年7月'
	AND `updated_at` = '2026-07-27T00:00:00.000Z'
	AND `allocation_items` = '[]';
