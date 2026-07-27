import type {
  AllocationItem,
  BudgetItem,
  MonthlyPlan,
  PaymentItem,
} from "./budget";
import {
  normalizeSimplifiedTaxCategory,
  STANDARD_CONSUMPTION_TAX_PERCENT,
} from "./consumption-tax.ts";
import { normalizeAllocationSourceIds } from "./allocation-groups.ts";
import { synchronizeMonthlyPlan } from "./plan-calculations.ts";

const MAX_ITEMS = 100;
const MAX_MONEY = 1_000_000_000;

export function normalizeMonthlyPlan(value: unknown): MonthlyPlan | null {
  if (!isRecord(value)) return null;

  const year = integerInRange(value.year, 2000, 2100);
  const month = integerInRange(value.month, 1, 12);
  const householdItems = normalizeBudgetItems(value.householdItems);
  const paymentItems = normalizePaymentItems(value.paymentItems);
  const allocationItems = normalizeAllocationItems(value.allocationItems);

  if (
    year === null ||
    month === null ||
    householdItems === null ||
    paymentItems === null ||
    allocationItems === null
  ) {
    return null;
  }

  return synchronizeMonthlyPlan({
    year,
    month,
    grossIncome: money(value.grossIncome),
    taxReservePercent: percent(value.taxReservePercent),
    consumptionTaxPercent: STANDARD_CONSUMPTION_TAX_PERCENT,
    simplifiedTaxCategory: normalizeSimplifiedTaxCategory(
      value.simplifiedTaxCategory,
    ),
    householdItems,
    paymentItems,
    allocationItems,
    memo: shortText(value.memo, 1_000),
    updatedAt: new Date().toISOString(),
  });
}

function normalizeBudgetItems(value: unknown): BudgetItem[] | null {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
  return value.map((item, index) => {
    const row = isRecord(item) ? item : {};
    return {
      id: stableId(row.id, `household-${index + 1}`),
      name: shortText(row.name, 80),
      budget: money(row.budget),
      ...(row.locked === true ? { locked: true } : {}),
    };
  });
}

function normalizePaymentItems(value: unknown): PaymentItem[] | null {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
  return value.map((item, index) => {
    const row = isRecord(item) ? item : {};
    return {
      id: stableId(row.id, `payment-${index + 1}`),
      name: shortText(row.name, 80),
      actual: money(row.actual),
      ...(row.locked === true ? { locked: true } : {}),
    };
  });
}

function normalizeAllocationItems(value: unknown): AllocationItem[] | null {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
  return value.map((item, index) => {
    const row = isRecord(item) ? item : {};
    return {
      id: stableId(row.id, `allocation-${index + 1}`),
      name: shortText(row.name, 80),
      amount: money(row.amount),
      sourceIds: normalizeAllocationSourceIds(row.sourceIds),
      ...(row.locked === true ? { locked: true } : {}),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function integerInRange(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value >= min && value <= max ? value : null;
}

function money(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(MAX_MONEY, Math.max(0, Math.round(value)));
}

function percent(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function shortText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function stableId(value: unknown, fallback: string): string {
  const normalized = shortText(value, 100).replace(/[^a-zA-Z0-9_-]/g, "");
  return normalized || fallback;
}
