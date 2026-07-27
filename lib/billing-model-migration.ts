import {
  assignAllocationSources,
  CONSUMPTION_TAX_SOURCE_ID,
  normalizeAllocationSourceIds,
  paymentSourceId,
  TAX_RESERVE_SOURCE_ID,
} from "./allocation-groups.ts";
import type { MonthlyPlan, PaymentItem } from "./budget.ts";
import type { BudgetTemplate } from "./budget-template.ts";
import { synchronizeMonthlyPlan } from "./plan-calculations.ts";

const CARD_ALIASES = ["SAISONカード", "カード代"];
const INVESTMENT_ALIASES = ["みずほ王子", "積立投資"];
const GYM_ALIASES = ["ジム"];

export function migrateJulyWorkbookBilling(plan: MonthlyPlan): MonthlyPlan {
  if (plan.year !== 2026 || plan.month !== 7) return plan;

  let paymentItems = plan.paymentItems.map(({ id, name, actual, locked }) => ({
    id,
    name,
    actual,
    ...(locked ? { locked: true } : {}),
  }));
  const investment = ensureBillingItem(
    paymentItems,
    INVESTMENT_ALIASES,
    "積立投資",
    3_000,
    "billing-2026-07-investment",
  );
  paymentItems = investment.items;
  const gym = ensureBillingItem(
    paymentItems,
    GYM_ALIASES,
    "ジム",
    12_070,
    "billing-2026-07-gym",
  );
  paymentItems = gym.items;
  const card = findBillingItem(paymentItems, CARD_ALIASES);

  const requiredSourceIds = [
    TAX_RESERVE_SOURCE_ID,
    CONSUMPTION_TAX_SOURCE_ID,
    ...(card ? [paymentSourceId(card.id)] : []),
    paymentSourceId(investment.item.id),
    paymentSourceId(gym.item.id),
  ];

  return synchronizeMonthlyPlan({
    ...plan,
    householdItems: plan.householdItems.map(({ id, name, budget, locked }) => ({
      id,
      name,
      budget,
      ...(locked ? { locked: true } : {}),
    })),
    paymentItems,
    allocationItems: assignOjiSources(
      plan.allocationItems,
      requiredSourceIds,
    ),
  });
}

export function migrateBillingTemplate(
  template: BudgetTemplate,
): BudgetTemplate {
  let paymentItems = template.paymentItems.map(({ id, name, locked }) => ({
    id,
    name,
    actual: 0,
    ...(locked ? { locked: true } : {}),
  }));
  const investment = ensureBillingItem(
    paymentItems,
    INVESTMENT_ALIASES,
    "積立投資",
    0,
    "billing-template-investment",
  );
  paymentItems = investment.items;
  const gym = ensureBillingItem(
    paymentItems,
    GYM_ALIASES,
    "ジム",
    0,
    "billing-template-gym",
  );
  paymentItems = gym.items;
  const card = findBillingItem(paymentItems, CARD_ALIASES);

  const requiredSourceIds = [
    TAX_RESERVE_SOURCE_ID,
    CONSUMPTION_TAX_SOURCE_ID,
    ...(card ? [paymentSourceId(card.id)] : []),
    paymentSourceId(investment.item.id),
    paymentSourceId(gym.item.id),
  ];

  return {
    ...template,
    householdItems: template.householdItems.map(({ id, name, budget, locked }) => ({
      id,
      name,
      budget,
      ...(locked ? { locked: true } : {}),
    })),
    paymentItems,
    allocationDestinations: assignOjiSources(
      template.allocationDestinations,
      requiredSourceIds,
    ),
  };
}

function assignOjiSources<T extends { id: string; name: string; sourceIds?: string[] }>(
  items: T[],
  requiredSourceIds: string[],
): T[] {
  const target = items.find((item) => item.name === "みずほ（王子）");
  if (!target) return items;
  return assignAllocationSources(items, target.id, [
    ...normalizeAllocationSourceIds(target.sourceIds),
    ...requiredSourceIds,
  ]);
}

function ensureBillingItem(
  items: PaymentItem[],
  aliases: string[],
  fallbackName: string,
  importedActual: number,
  fallbackId: string,
): { items: PaymentItem[]; item: PaymentItem } {
  const existing = findBillingItem(items, aliases);
  if (existing) {
    const item = {
      id: existing.id,
      name: existing.name,
      actual: existing.actual > 0 ? existing.actual : importedActual,
      ...(existing.locked ? { locked: true } : {}),
    };
    return {
      items: items.map((candidate) =>
        candidate.id === existing.id ? item : candidate,
      ),
      item,
    };
  }

  const item = {
    id: uniqueId(items, fallbackId),
    name: fallbackName,
    actual: importedActual,
  };
  return { items: [...items, item], item };
}

function findBillingItem(items: PaymentItem[], aliases: string[]) {
  return items.find((item) => aliases.includes(item.name.trim()));
}

function uniqueId(items: PaymentItem[], preferred: string) {
  const used = new Set(items.map((item) => item.id));
  if (!used.has(preferred)) return preferred;
  let suffix = 2;
  while (used.has(`${preferred}-${suffix}`)) suffix += 1;
  return `${preferred}-${suffix}`;
}
