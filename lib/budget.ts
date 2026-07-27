import {
  calculateSimplifiedConsumptionTax,
  DEFAULT_SIMPLIFIED_TAX_CATEGORY,
  STANDARD_CONSUMPTION_TAX_PERCENT,
  type SimplifiedTaxCategory,
} from "./consumption-tax.ts";

export type BudgetItem = {
  id: string;
  name: string;
  budget: number;
  locked?: boolean;
};

export type PaymentItem = {
  id: string;
  name: string;
  actual: number;
  locked?: boolean;
  /** Kept only so legacy workbook JSON can still be read during migration. */
  budget?: number;
};

export type AllocationItem = {
  id: string;
  name: string;
  amount: number;
  sourceIds?: string[];
  locked?: boolean;
};

export type MonthlyPlan = {
  year: number;
  month: number;
  grossIncome: number;
  taxReservePercent: number;
  consumptionTaxPercent: number;
  simplifiedTaxCategory: SimplifiedTaxCategory;
  householdItems: BudgetItem[];
  paymentItems: PaymentItem[];
  allocationItems: AllocationItem[];
  memo: string;
  updatedAt: string;
};

export type MonthlySummary = {
  taxReserve: number;
  consumptionTaxReserve: number;
  netAfterTaxReserve: number;
  householdBudget: number;
  householdCushion: number;
  allocationTotal: number;
};

export function roundUpToThousand(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value / 1_000) * 1_000;
}

export function calculateMonthlySummary(plan: MonthlyPlan): MonthlySummary {
  const grossIncome = finiteMoney(plan.grossIncome);
  const taxRate = finitePercent(plan.taxReservePercent);
  const taxReserve = roundUpToThousand(grossIncome * (taxRate / 100));
  const consumptionTaxReserve = calculateSimplifiedConsumptionTax(
    grossIncome,
    plan.simplifiedTaxCategory,
  );
  const householdBudget = sumMoney(
    plan.householdItems.map((item) => item.budget),
  );
  const allocationTotal = sumMoney(
    plan.allocationItems.map((item) => item.amount),
  );

  return {
    taxReserve,
    consumptionTaxReserve,
    netAfterTaxReserve: grossIncome - taxReserve,
    householdBudget,
    householdCushion: grossIncome - taxReserve - householdBudget,
    allocationTotal,
  };
}

export function calculateAnnualTotals(plans: MonthlyPlan[]) {
  return plans.reduce(
    (totals, plan) => {
      const summary = calculateMonthlySummary(plan);
      totals.grossIncome += finiteMoney(plan.grossIncome);
      totals.taxReserve += summary.taxReserve;
      totals.householdBudget += summary.householdBudget;
      return totals;
    },
    { grossIncome: 0, taxReserve: 0, householdBudget: 0 },
  );
}

export function createEmptyMonth(year: number, month: number): MonthlyPlan {
  return {
    year,
    month,
    grossIncome: 0,
    taxReservePercent: 30,
    consumptionTaxPercent: STANDARD_CONSUMPTION_TAX_PERCENT,
    simplifiedTaxCategory: DEFAULT_SIMPLIFIED_TAX_CATEGORY,
    householdItems: [],
    paymentItems: [],
    allocationItems: [],
    memo: "",
    updatedAt: new Date(0).toISOString(),
  };
}

function sumMoney(values: number[]): number {
  return values.reduce((sum, value) => sum + finiteMoney(value), 0);
}

function finiteMoney(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function finitePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
