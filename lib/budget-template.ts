import {
  createEmptyMonth,
  type BudgetItem,
  type MonthlyPlan,
  type PaymentItem,
} from "./budget.ts";
import type { SimplifiedTaxCategory } from "./consumption-tax.ts";
import { remapAllocationSourceIds } from "./allocation-groups.ts";
import { synchronizeMonthlyPlan } from "./plan-calculations.ts";

export type BudgetTemplate = {
  simplifiedTaxCategory: SimplifiedTaxCategory;
  householdItems: BudgetItem[];
  paymentItems: PaymentItem[];
  allocationDestinations: AllocationDestination[];
  source: string;
  updatedAt: string;
};

export type AllocationDestination = {
  id: string;
  name: string;
  sourceIds?: string[];
  locked?: boolean;
};

export function createTemplateFromPlan(
  plan: MonthlyPlan,
  source = `${plan.year}年${plan.month}月から保存`,
): BudgetTemplate {
  const structure = cloneBudgetStructure(
    plan.householdItems,
    plan.paymentItems,
    "template",
  );
  return {
    simplifiedTaxCategory: plan.simplifiedTaxCategory,
    householdItems: structure.householdItems,
    paymentItems: structure.paymentItems,
    allocationDestinations: cloneAllocationDestinations(
      plan.allocationItems,
      "template",
      structure.paymentIdMap,
    ),
    source,
    updatedAt: new Date().toISOString(),
  };
}

export function createPlanFromTemplate(
  template: BudgetTemplate,
  year: number,
  month: number,
): MonthlyPlan {
  const period = `${year}-${month}`;
  const structure = cloneBudgetStructure(
    template.householdItems,
    template.paymentItems,
    period,
  );
  return synchronizeMonthlyPlan({
    ...createEmptyMonth(year, month),
    simplifiedTaxCategory: template.simplifiedTaxCategory,
    householdItems: structure.householdItems,
    paymentItems: structure.paymentItems,
    allocationItems: template.allocationDestinations.map((destination, index) => ({
      id: `${period}-allocation-${index + 1}`,
      name: destination.name,
      amount: 0,
      sourceIds: remapAllocationSourceIds(
        destination.sourceIds,
        structure.paymentIdMap,
      ),
      ...(destination.locked ? { locked: true } : {}),
    })),
  });
}

export function copyPlanBudget(
  sourcePlan: MonthlyPlan,
  year: number,
  month: number,
): MonthlyPlan {
  const period = `${year}-${month}`;
  const structure = cloneBudgetStructure(
    sourcePlan.householdItems,
    sourcePlan.paymentItems,
    period,
    { paymentActuals: "preserve" },
  );
  return synchronizeMonthlyPlan({
    ...createEmptyMonth(year, month),
    taxReservePercent: sourcePlan.taxReservePercent,
    consumptionTaxPercent: 10,
    simplifiedTaxCategory: sourcePlan.simplifiedTaxCategory,
    householdItems: structure.householdItems,
    paymentItems: structure.paymentItems,
    allocationItems: sourcePlan.allocationItems.map((item, index) => ({
      id: `${period}-allocation-${index + 1}`,
      name: item.name,
      amount: 0,
      sourceIds: remapAllocationSourceIds(
        item.sourceIds,
        structure.paymentIdMap,
      ),
      ...(item.locked ? { locked: true } : {}),
    })),
  });
}

function cloneBudgetStructure(
  householdItems: BudgetItem[],
  paymentItems: PaymentItem[],
  prefix: string,
  options: { paymentActuals?: "preserve" | "reset" } = {},
) {
  const paymentIdMap = new Map<string, string>();
  const clonedPayments = paymentItems.map((item, index) => {
    const id = `${prefix}-payment-${index + 1}`;
    paymentIdMap.set(item.id, id);
    return {
      id,
      name: item.name,
      actual: options.paymentActuals === "preserve" ? item.actual : 0,
      ...(item.locked ? { locked: true } : {}),
    };
  });
  const clonedHousehold = householdItems.map((item, index) => ({
    id: `${prefix}-household-${index + 1}`,
    name: item.name,
    budget: item.budget,
    ...(item.locked ? { locked: true } : {}),
  }));

  return {
    householdItems: clonedHousehold,
    paymentItems: clonedPayments,
    paymentIdMap,
  };
}

function cloneAllocationDestinations(
  items: Array<{ id: string; name: string; sourceIds?: string[]; locked?: boolean }>,
  prefix: string,
  paymentIdMap: Map<string, string>,
): AllocationDestination[] {
  return items.map((item, index) => ({
    id: `${prefix}-allocation-${index + 1}`,
    name: item.name,
    sourceIds: remapAllocationSourceIds(item.sourceIds, paymentIdMap),
    ...(item.locked ? { locked: true } : {}),
  }));
}
