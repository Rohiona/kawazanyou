import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAnnualTotals,
  calculateMonthlySummary,
  createEmptyMonth,
  roundUpToThousand,
} from "../lib/budget.ts";
import { normalizeMonthlyPlan } from "../lib/monthly-plan-input.ts";
import {
  copyPlanBudget,
  createPlanFromTemplate,
  createTemplateFromPlan,
} from "../lib/budget-template.ts";
import { normalizeBudgetTemplate } from "../lib/budget-template-input.ts";
import { importedJulyBudgetTemplate } from "../db/imported-budget-template.ts";
import { imported2026Template } from "../db/imported-template.ts";
import {
  formatMoneyText,
  moneyFromText,
  normalizeMoneyText,
} from "../lib/money-input.ts";
import {
  repairBudgetTemplateFromImport,
  repairMonthlyPlanFromImport,
} from "../lib/import-repair.ts";
import { mergeMizuhoOjiAllocations } from "../lib/allocation-account-merge.ts";
import {
  assignAllocationSources,
  calculateAllocationAmounts,
  CONSUMPTION_TAX_SOURCE_ID,
  paymentSourceId,
  TAX_RESERVE_SOURCE_ID,
} from "../lib/allocation-groups.ts";
import {
  migrateBillingTemplate,
  migrateJulyWorkbookBilling,
} from "../lib/billing-model-migration.ts";
import { moveRow, setRowLocked } from "../lib/row-order.ts";

test("tax reserve rounds up to the next thousand yen", () => {
  assert.equal(roundUpToThousand(270_000), 270_000);
  assert.equal(roundUpToThousand(270_001), 271_000);
  assert.equal(roundUpToThousand(0), 0);
});

test("money input accepts Japanese digits, commas, and currency marks", () => {
  assert.equal(normalizeMoneyText("￥１，２３４円"), "1234");
  assert.equal(moneyFromText("1,129,021"), 1_129_021);
  assert.equal(moneyFromText(""), 0);
  assert.equal(moneyFromText("9999999999"), 1_000_000_000);
  assert.equal(formatMoneyText(1_129_021), "1,129,021");
  assert.equal(formatMoneyText(103_392, true), "¥ 103,392");
  assert.equal(formatMoneyText(-15_406, true), "-¥ 15,406");
});

test("a saved report amount does not block authoritative workbook details", () => {
  const shell = {
    ...createEmptyMonth(2026, 7),
    grossIncome: 1_129_021,
  };
  const imported = {
    ...shell,
    consumptionTaxPercent: 5,
    householdItems: [{ id: "rent", name: "家賃", budget: 100_000 }],
    paymentItems: [{ id: "card", name: "カード", budget: 20_000, actual: 18_000 }],
    allocationItems: [{ id: "bank", name: "生活費用", amount: 50_000 }],
    memo: "Excelから移行",
  };

  assert.equal(repairMonthlyPlanFromImport(shell, imported), imported);
});

test("workbook repair fills only missing sections of an edited month", () => {
  const imported = createEmptyMonth(2026, 7);
  imported.householdItems = [{ id: "excel-rent", name: "家賃", budget: 100_000 }];
  imported.paymentItems = [{ id: "excel-card", name: "カード", budget: 20_000, actual: 18_000 }];
  imported.allocationItems = [{ id: "excel-bank", name: "生活費用", amount: 50_000 }];
  imported.memo = "Excelから移行";

  const current = {
    ...createEmptyMonth(2026, 7),
    householdItems: [{ id: "edited-rent", name: "家賃", budget: 120_000 }],
  };
  const repaired = repairMonthlyPlanFromImport(current, imported);

  assert.equal(repaired.householdItems, current.householdItems);
  assert.equal(repaired.paymentItems, imported.paymentItems);
  assert.equal(repaired.allocationItems, imported.allocationItems);
});

test("template repair preserves edited sections and fills empty ones", () => {
  const empty = createTemplateFromPlan(createEmptyMonth(2026, 7));
  const editedHousehold = [{ id: "rent", name: "家賃", budget: 120_000 }];
  const current = { ...empty, householdItems: editedHousehold };
  const repaired = repairBudgetTemplateFromImport(
    current,
    importedJulyBudgetTemplate,
  );

  assert.equal(repaired.householdItems, editedHousehold);
  assert.equal(repaired.paymentItems, importedJulyBudgetTemplate.paymentItems);
  assert.equal(
    repaired.allocationDestinations,
    importedJulyBudgetTemplate.allocationDestinations,
  );
});

test("monthly summary reproduces the workbook household cushion", () => {
  const plan = createEmptyMonth(2026, 1);
  plan.grossIncome = 900_000;
  plan.taxReservePercent = 30;
  plan.consumptionTaxPercent = 5;
  plan.householdItems = [
    { id: "rent", name: "家賃＋駐車場", budget: 115_770 },
    { id: "other", name: "その他の家計予算", budget: 389_686 },
  ];

  assert.deepEqual(calculateMonthlySummary(plan), {
    taxReserve: 270_000,
    consumptionTaxReserve: 40_909,
    netAfterTaxReserve: 630_000,
    householdBudget: 505_456,
    householdCushion: 124_544,
    allocationTotal: 0,
  });
});

test("annual totals aggregate only supplied months", () => {
  const january = createEmptyMonth(2026, 1);
  january.grossIncome = 900_000;
  const february = createEmptyMonth(2026, 2);
  february.grossIncome = 1_000_000;

  assert.deepEqual(calculateAnnualTotals([january, february]), {
    grossIncome: 1_900_000,
    taxReserve: 570_000,
    householdBudget: 0,
  });
});

test("monthly plan input clamps unsafe values and normalizes rows", () => {
  const normalized = normalizeMonthlyPlan({
    year: 2026,
    month: 7,
    grossIncome: 2_000_000_000,
    taxReservePercent: 130,
    consumptionTaxPercent: -5,
    householdItems: [{ id: "家賃 id", name: " 家賃 ", budget: 120_000.4 }],
    paymentItems: [],
    allocationItems: [],
    memo: " メモ ",
  });

  assert.ok(normalized);
  assert.equal(normalized.grossIncome, 1_000_000_000);
  assert.equal(normalized.taxReservePercent, 100);
  assert.equal(normalized.consumptionTaxPercent, 10);
  assert.equal(normalized.simplifiedTaxCategory, 5);
  assert.deepEqual(normalized.householdItems, [
    { id: "id", name: "家賃", budget: 120_000 },
  ]);
  assert.equal(normalized.memo, "メモ");
});

test("monthly plan input rejects invalid periods", () => {
  assert.equal(
    normalizeMonthlyPlan({
      year: 2026,
      month: 13,
      householdItems: [],
      paymentItems: [],
      allocationItems: [],
    }),
    null,
  );
});

test("locked rows keep their contents guarded but remain reorderable", () => {
  const rows = [
    { id: "first", name: "固定費", locked: true },
    { id: "second", name: "変動費" },
  ];

  const moved = moveRow(rows, "first", 1);
  assert.deepEqual(moved.map((item) => item.id), ["second", "first"]);
  assert.equal(moved[1].locked, true);
  assert.equal(moveRow(moved, "first", 1), moved);

  const unlocked = setRowLocked(moved, "first", false);
  assert.equal("locked" in unlocked[1], false);
  assert.equal(setRowLocked(unlocked, "missing", true), unlocked);
});

test("row locks survive monthly and template normalization", () => {
  const normalizedPlan = normalizeMonthlyPlan({
    year: 2026,
    month: 7,
    householdItems: [{ id: "rent", name: "家賃", budget: 120_000, locked: true }],
    paymentItems: [{ id: "card", name: "カード", actual: 80_000, locked: true }],
    allocationItems: [{ id: "bank", name: "口座", amount: 0, locked: true }],
  });
  assert.ok(normalizedPlan);
  assert.equal(normalizedPlan.householdItems[0].locked, true);
  assert.equal(normalizedPlan.paymentItems[0].locked, true);
  assert.equal(normalizedPlan.allocationItems[0].locked, true);

  const template = createTemplateFromPlan(normalizedPlan);
  const normalizedTemplate = normalizeBudgetTemplate(template);
  assert.ok(normalizedTemplate);
  const nextMonth = createPlanFromTemplate(normalizedTemplate, 2026, 8);
  assert.equal(nextMonth.householdItems[0].locked, true);
  assert.equal(nextMonth.paymentItems[0].locked, true);
  assert.equal(nextMonth.allocationItems[0].locked, true);
});

test("July workbook expense plans are the migrated template source", () => {
  assert.equal(importedJulyBudgetTemplate.source, "皮算用_2026.xlsx 2026年7月");
  assert.equal("grossIncome" in importedJulyBudgetTemplate, false);
  assert.equal("taxReservePercent" in importedJulyBudgetTemplate, false);
  assert.equal("consumptionTaxPercent" in importedJulyBudgetTemplate, false);
  assert.equal(
    importedJulyBudgetTemplate.householdItems.reduce(
      (sum, item) => sum + item.budget,
      0,
    ),
    505_456,
  );
  assert.ok(
    importedJulyBudgetTemplate.paymentItems.every((item) => item.actual === 0),
  );
  assert.ok(
    importedJulyBudgetTemplate.paymentItems.every(
      (item) => item.budget === undefined,
    ),
  );
  assert.equal(importedJulyBudgetTemplate.simplifiedTaxCategory, 5);
  const july = imported2026Template.find((plan) => plan.month === 7);
  assert.ok(july);
  assert.deepEqual(
    july.allocationItems.slice(0, 2).map(({ name, amount }) => ({ name, amount })),
    [
      { name: "みずほ（王子）", amount: 0 },
      { name: "みずほ（川越）", amount: 0 },
    ],
  );
  assert.deepEqual(
    importedJulyBudgetTemplate.allocationDestinations.map((item) => item.name),
    ["みずほ（王子）", "みずほ（川越）", "ソニー銀行", "ゆうちょ", "手渡し", "インデックス投資"],
  );
});

test("Aoyama and Oji allocations are merged into the actual Oji transfer", () => {
  const items = [
    { id: "aoyama", name: "みずほ（青山）", amount: 392_763 },
    { id: "oji", name: "みずほ（王子）", amount: 118_462 },
    { id: "kawagoe", name: "みずほ（川越）", amount: 50_000 },
  ];

  assert.deepEqual(mergeMizuhoOjiAllocations(items), [
    { id: "oji", name: "みずほ（王子）", amount: 511_225 },
    { id: "kawagoe", name: "みずほ（川越）", amount: 50_000 },
  ]);
  const alreadyMerged = [
    { id: "oji", name: "みずほ（王子）", amount: 511_225 },
  ];
  assert.equal(mergeMizuhoOjiAllocations(alreadyMerged), alreadyMerged);
});

test("simplified consumption tax uses the selected business category", () => {
  const servicePlan = createEmptyMonth(2026, 7);
  servicePlan.grossIncome = 1_129_021;
  servicePlan.simplifiedTaxCategory = 5;
  assert.equal(
    calculateMonthlySummary(servicePlan).consumptionTaxReserve,
    51_319,
  );

  servicePlan.simplifiedTaxCategory = 1;
  assert.equal(
    calculateMonthlySummary(servicePlan).consumptionTaxReserve,
    10_264,
  );
});

test("household budgets and confirmed billings stay independent", () => {
  const normalized = normalizeMonthlyPlan({
    year: 2026,
    month: 7,
    householdItems: [
      {
        id: "food",
        name: "食費",
        budget: 50_000,
        paymentGroupId: "legacy-card",
      },
    ],
    paymentItems: [
      { id: "card", name: "カード", budget: 80_000, actual: 70_000 },
    ],
    allocationItems: [],
  });

  assert.ok(normalized);
  assert.deepEqual(normalized.householdItems, [
    { id: "food", name: "食費", budget: 50_000 },
  ]);
  assert.deepEqual(normalized.paymentItems, [
    { id: "card", name: "カード", actual: 70_000 },
  ]);
});

test("an account sums multiple selected groups and an unselected account is zero", () => {
  const paymentItems = [
    { id: "card", name: "カード", actual: 70_000 },
    { id: "cash", name: "現金", actual: 10_000 },
  ];
  const allocations = calculateAllocationAmounts(
    [
      {
        id: "main",
        name: "メイン口座",
        amount: 999_999,
        sourceIds: [
          TAX_RESERVE_SOURCE_ID,
          CONSUMPTION_TAX_SOURCE_ID,
          paymentSourceId("card"),
          paymentSourceId("cash"),
        ],
      },
      { id: "empty", name: "未指定口座", amount: 999_999 },
    ],
    paymentItems,
    { taxReserve: 270_000, consumptionTaxReserve: 40_909 },
  );

  assert.deepEqual(
    allocations.map(({ name, amount }) => ({ name, amount })),
    [
      { name: "メイン口座", amount: 390_909 },
      { name: "未指定口座", amount: 0 },
    ],
  );
});

test("assigning a group to another account moves it instead of double counting", () => {
  const cardSource = paymentSourceId("card");
  const accounts = [
    { id: "first", name: "口座A", amount: 0, sourceIds: [cardSource] },
    { id: "second", name: "口座B", amount: 0, sourceIds: [] },
  ];

  assert.deepEqual(
    assignAllocationSources(accounts, "second", [cardSource]).map(
      ({ id, sourceIds }) => ({ id, sourceIds }),
    ),
    [
      { id: "first", sourceIds: [] },
      { id: "second", sourceIds: [cardSource] },
    ],
  );
});

test("applying a template keeps budgets and resets month-specific values", () => {
  const august = createPlanFromTemplate(importedJulyBudgetTemplate, 2026, 8);

  assert.equal(august.grossIncome, 0);
  assert.equal(august.month, 8);
  assert.equal(august.paymentItems[0].budget, undefined);
  assert.equal(august.paymentItems[0].actual, 0);
  assert.deepEqual(
    august.allocationItems.map(({ name, amount }) => ({ name, amount })),
    [
      { name: "みずほ（王子）", amount: 0 },
      { name: "みずほ（川越）", amount: 0 },
      { name: "ソニー銀行", amount: 0 },
      { name: "ゆうちょ", amount: 0 },
      { name: "手渡し", amount: 0 },
      { name: "インデックス投資", amount: 0 },
    ],
  );
  assert.equal(august.taxReservePercent, 30);
  assert.equal(august.consumptionTaxPercent, 10);
  assert.equal(august.simplifiedTaxCategory, 5);
  assert.equal(august.memo, "");
  august.householdItems[0].budget = 1;
  assert.equal(importedJulyBudgetTemplate.householdItems[0].budget, 115_770);
});

test("copying a previous month keeps billing actuals and reusable budget fields", () => {
  const july = createPlanFromTemplate(importedJulyBudgetTemplate, 2026, 7);
  july.grossIncome = 1_129_021;
  july.paymentItems[0].actual = 103_392;
  july.allocationItems = [
    { id: "income-derived", name: "報酬連動の振り分け", amount: 392_763 },
  ];
  july.taxReservePercent = 28;
  july.consumptionTaxPercent = 5;
  july.simplifiedTaxCategory = 3;
  july.memo = "実績メモ";

  const august = copyPlanBudget(july, 2026, 8);
  assert.equal(august.grossIncome, 0);
  assert.equal(august.paymentItems[0].actual, 103_392);
  assert.deepEqual(
    august.allocationItems.map(({ name, amount }) => ({ name, amount })),
    [{ name: "報酬連動の振り分け", amount: 0 }],
  );
  assert.equal(august.taxReservePercent, 28);
  assert.equal(august.consumptionTaxPercent, 10);
  assert.equal(august.simplifiedTaxCategory, 3);
  assert.equal(august.memo, "");
  assert.equal(august.householdItems[0].budget, july.householdItems[0].budget);
  august.paymentItems[0].actual = 1;
  assert.equal(july.paymentItems[0].actual, 103_392);
});

test("budget template input clears payment actuals", () => {
  const source = createTemplateFromPlan(
    {
      ...createEmptyMonth(2026, 7),
      paymentItems: [
        { id: "card", name: "カード代", actual: 60_000 },
      ],
    },
    " 7月から保存 ",
  );
  source.paymentItems[0].actual = 60_000;
  const normalized = normalizeBudgetTemplate(source);

  assert.ok(normalized);
  assert.equal(normalized.paymentItems[0].actual, 0);
  assert.equal(normalized.source, "7月から保存");
});

test("account group selections survive template id remapping", () => {
  const plan = createEmptyMonth(2026, 7);
  plan.householdItems = [
    { id: "food", name: "食費", budget: 50_000 },
  ];
  plan.paymentItems = [
    { id: "card", name: "カード", actual: 45_000 },
  ];
  plan.allocationItems = [
    {
      id: "bank",
      name: "引落口座",
      amount: 0,
      sourceIds: [paymentSourceId("card")],
    },
  ];

  const template = createTemplateFromPlan(plan);
  const nextMonth = createPlanFromTemplate(template, 2026, 8);

  assert.deepEqual(nextMonth.allocationItems[0].sourceIds, [
    paymentSourceId(nextMonth.paymentItems[0].id),
  ]);
  assert.equal(nextMonth.allocationItems[0].amount, 0);
});

test("July billing migration restores Excel bills and uses them for Oji", () => {
  const plan = createEmptyMonth(2026, 7);
  plan.grossIncome = 1_129_021;
  plan.householdItems = [
    {
      id: "gym-budget",
      name: "ジム",
      budget: 14_000,
    },
  ];
  plan.paymentItems = [
    { id: "saison", name: "SAISONカード", actual: 103_392 },
    { id: "oji-billing", name: "みずほ王子", actual: 0 },
    { id: "investment", name: "投資用", actual: 0 },
  ];
  plan.allocationItems = [
    {
      id: "oji",
      name: "みずほ（王子）",
      amount: 0,
      sourceIds: [
        TAX_RESERVE_SOURCE_ID,
        CONSUMPTION_TAX_SOURCE_ID,
        paymentSourceId("saison"),
      ],
    },
  ];

  const migrated = migrateJulyWorkbookBilling(plan);
  assert.deepEqual(migrated.householdItems, [
    { id: "gym-budget", name: "ジム", budget: 14_000 },
  ]);
  assert.equal(
    migrated.paymentItems.find((item) => item.name === "みずほ王子")?.actual,
    3_000,
  );
  assert.equal(
    migrated.paymentItems.find((item) => item.name === "ジム")?.actual,
    12_070,
  );
  assert.equal(migrated.allocationItems[0].amount, 508_781);
  assert.equal(migrated.allocationItems[0].sourceIds?.length, 5);
});

test("billing template keeps names and Oji group mappings, not monthly amounts", () => {
  const plan = createEmptyMonth(2026, 7);
  plan.paymentItems = [
    { id: "saison", name: "SAISONカード", actual: 103_392 },
    { id: "oji-billing", name: "みずほ王子", actual: 3_000 },
  ];
  plan.allocationItems = [
    { id: "oji", name: "みずほ（王子）", amount: 0, sourceIds: [] },
  ];

  const migrated = migrateBillingTemplate(createTemplateFromPlan(plan));
  assert.equal(
    migrated.paymentItems.find((item) => item.name === "ジム")?.actual,
    0,
  );
  assert.ok(migrated.paymentItems.every((item) => item.actual === 0));
  assert.equal(migrated.allocationDestinations[0].sourceIds?.length, 5);
});
