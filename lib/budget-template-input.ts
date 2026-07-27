import type { BudgetTemplate } from "./budget-template";
import { normalizeMonthlyPlan } from "./monthly-plan-input.ts";

export function normalizeBudgetTemplate(value: unknown): BudgetTemplate | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const allocationDestinations = Array.isArray(candidate.allocationDestinations)
    ? candidate.allocationDestinations
    : [];
  const normalized = normalizeMonthlyPlan({
    year: 2026,
    month: 1,
    grossIncome: 0,
    taxReservePercent: 0,
    consumptionTaxPercent: 10,
    simplifiedTaxCategory: candidate.simplifiedTaxCategory,
    householdItems: candidate.householdItems,
    paymentItems: candidate.paymentItems,
    allocationItems: allocationDestinations.map((item) => ({
      ...(typeof item === "object" && item !== null ? item : {}),
      amount: 0,
    })),
    memo: "",
  });
  if (!normalized) return null;

  return {
    simplifiedTaxCategory: normalized.simplifiedTaxCategory,
    householdItems: normalized.householdItems,
    paymentItems: normalized.paymentItems.map((item) => ({ ...item, actual: 0 })),
    allocationDestinations: normalized.allocationItems.map(({ id, name, sourceIds, locked }) => ({
      id,
      name,
      sourceIds,
      ...(locked ? { locked: true } : {}),
    })),
    source:
      typeof candidate.source === "string"
        ? candidate.source.trim().slice(0, 120) || "手動作成"
        : "手動作成",
    updatedAt: new Date().toISOString(),
  };
}
