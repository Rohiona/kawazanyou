import type { MonthlyPlan } from "./budget.ts";
import type { BudgetTemplate } from "./budget-template.ts";

export function repairMonthlyPlanFromImport(
  current: MonthlyPlan | null,
  imported: MonthlyPlan,
): MonthlyPlan {
  if (!current) return imported;

  const hasNoWorkbookDetails =
    current.householdItems.length === 0 &&
    current.paymentItems.length === 0 &&
    current.allocationItems.length === 0 &&
    current.memo.trim() === "";

  // A report amount may have been saved before the workbook import. In that
  // case the row is still only a shell, so the workbook remains authoritative.
  if (hasNoWorkbookDetails) return imported;

  const householdItems =
    current.householdItems.length > 0
      ? current.householdItems
      : imported.householdItems;
  const paymentItems =
    current.paymentItems.length > 0 ? current.paymentItems : imported.paymentItems;
  const allocationItems =
    current.allocationItems.length > 0
      ? current.allocationItems
      : imported.allocationItems;
  const memo = current.memo.trim() ? current.memo : imported.memo;

  if (
    householdItems === current.householdItems &&
    paymentItems === current.paymentItems &&
    allocationItems === current.allocationItems &&
    memo === current.memo
  ) {
    return current;
  }

  return {
    ...current,
    householdItems,
    paymentItems,
    allocationItems,
    memo,
  };
}

export function repairBudgetTemplateFromImport(
  current: BudgetTemplate | null,
  imported: BudgetTemplate,
): BudgetTemplate {
  if (!current) return imported;

  const householdItems =
    current.householdItems.length > 0
      ? current.householdItems
      : imported.householdItems;
  const paymentItems =
    current.paymentItems.length > 0 ? current.paymentItems : imported.paymentItems;
  const allocationDestinations =
    current.allocationDestinations.length > 0 &&
    !isLegacyDefaultAllocationDestinations(current.allocationDestinations)
      ? current.allocationDestinations
      : imported.allocationDestinations;

  if (
    householdItems === current.householdItems &&
    paymentItems === current.paymentItems &&
    allocationDestinations === current.allocationDestinations
  ) {
    return current;
  }

  return {
    ...current,
    householdItems,
    paymentItems,
    allocationDestinations,
    source: imported.source,
    updatedAt: imported.updatedAt,
  };
}

const LEGACY_DEFAULT_DESTINATION_NAMES = [
  "税金用",
  "引落用",
  "生活費用",
  "貯蓄用",
  "予備",
  "現金",
  "投資用",
];

function isLegacyDefaultAllocationDestinations(
  destinations: BudgetTemplate["allocationDestinations"],
): boolean {
  return (
    destinations.length === LEGACY_DEFAULT_DESTINATION_NAMES.length &&
    destinations.every(
      (destination, index) =>
        destination.name === LEGACY_DEFAULT_DESTINATION_NAMES[index] &&
        (destination.sourceIds?.length ?? 0) === 0,
    )
  );
}
