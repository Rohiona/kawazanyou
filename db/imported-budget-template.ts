import { createTemplateFromPlan } from "../lib/budget-template.ts";
import { imported2026Template } from "./imported-template.ts";

const july2026 = imported2026Template.find((plan) => plan.month === 7);

if (!july2026) {
  throw new Error("The July 2026 workbook plan is missing.");
}

export const importedJulyBudgetTemplate = {
  ...createTemplateFromPlan(july2026, "皮算用_2026.xlsx 2026年7月"),
  updatedAt: july2026.updatedAt,
};
