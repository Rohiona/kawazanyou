import { calculateMonthlySummary, type MonthlyPlan } from "./budget.ts";
import { calculateAllocationAmounts } from "./allocation-groups.ts";

export function synchronizeMonthlyPlan(plan: MonthlyPlan): MonthlyPlan {
  const summary = calculateMonthlySummary(plan);

  return {
    ...plan,
    allocationItems: calculateAllocationAmounts(
      plan.allocationItems,
      plan.paymentItems,
      summary,
    ),
  };
}
