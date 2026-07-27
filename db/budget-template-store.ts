import { eq } from "drizzle-orm";
import type { BudgetTemplate } from "../lib/budget-template";
import { appMeta, budgetTemplates } from "./schema";
import { importedJulyBudgetTemplate } from "./imported-budget-template";
import type { getDb } from ".";
import { repairBudgetTemplateFromImport } from "../lib/import-repair";
import { normalizeSimplifiedTaxCategory } from "../lib/consumption-tax.ts";
import { normalizeAllocationSourceIds } from "../lib/allocation-groups.ts";

const IMPORT_OWNER_KEY = "excel_import_owner";
const TEMPLATE_REPAIR_KEY = "excel_budget_template_repair_v3";
type Database = Awaited<ReturnType<typeof getDb>>;

export async function seedImportedBudgetTemplate(db: Database, email: string) {
  const [claim] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, IMPORT_OWNER_KEY))
    .limit(1);

  if (claim?.value !== email) return;

  const [seeded] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, TEMPLATE_REPAIR_KEY))
    .limit(1);
  if (seeded?.value === email) return;

  const existing = await findBudgetTemplate(db, email);
  const repaired = repairBudgetTemplateFromImport(
    existing,
    importedJulyBudgetTemplate,
  );
  if (repaired !== existing) {
    await saveBudgetTemplate(db, email, repaired);
  }

  await db
    .insert(appMeta)
    .values({ key: TEMPLATE_REPAIR_KEY, value: email })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: { value: email },
    });
}

export async function findBudgetTemplate(db: Database, email: string) {
  const [row] = await db
    .select()
    .from(budgetTemplates)
    .where(eq(budgetTemplates.ownerEmail, email))
    .limit(1);
  return row ? toBudgetTemplate(row) : null;
}

export async function saveBudgetTemplate(
  db: Database,
  email: string,
  template: BudgetTemplate,
) {
  const values = toDatabaseValues(email, template);
  const [saved] = await db
    .insert(budgetTemplates)
    .values(values)
    .onConflictDoUpdate({
      target: budgetTemplates.ownerEmail,
      set: values,
    })
    .returning();
  return toBudgetTemplate(saved);
}

export async function saveSimplifiedTaxCategory(
  db: Database,
  email: string,
  simplifiedTaxCategory: number,
) {
  await db
    .update(budgetTemplates)
    .set({
      simplifiedTaxCategory: normalizeSimplifiedTaxCategory(
        simplifiedTaxCategory,
      ),
      consumptionTaxPercent: 10,
    })
    .where(eq(budgetTemplates.ownerEmail, email));
}

function toDatabaseValues(ownerEmail: string, template: BudgetTemplate) {
  return {
    ownerEmail,
    taxReservePercent: 30,
    consumptionTaxPercent: 10,
    simplifiedTaxCategory: template.simplifiedTaxCategory,
    householdItems: JSON.stringify(template.householdItems),
    paymentItems: JSON.stringify(
      template.paymentItems.map((item) => ({ ...item, actual: 0 })),
    ),
    allocationItems: JSON.stringify(
      template.allocationDestinations.map((destination) => ({
        ...destination,
        amount: 0,
      })),
    ),
    source: template.source,
    updatedAt: template.updatedAt,
  };
}

function toBudgetTemplate(
  row: typeof budgetTemplates.$inferSelect,
): BudgetTemplate {
  const rawHouseholdItems = JSON.parse(row.householdItems);
  const rawPaymentItems = JSON.parse(row.paymentItems);
  const householdItems = rawHouseholdItems.map(
    (item: { id: string; name: string; budget: number; locked?: unknown }) => ({
      id: item.id,
      name: item.name,
      budget: item.budget,
      ...(item.locked === true ? { locked: true } : {}),
    }),
  );
  return {
    simplifiedTaxCategory: normalizeSimplifiedTaxCategory(
      row.simplifiedTaxCategory,
    ),
    householdItems,
    paymentItems: rawPaymentItems.map(
      (item: { id: string; name: string; locked?: unknown }) => ({
        id: item.id,
        name: item.name,
        actual: 0,
        ...(item.locked === true ? { locked: true } : {}),
      }),
    ),
    allocationDestinations: JSON.parse(row.allocationItems).map(
      (item: { id: string; name: string; sourceIds?: unknown; locked?: unknown }) => ({
        id: item.id,
        name: item.name,
        sourceIds: normalizeAllocationSourceIds(item.sourceIds),
        ...(item.locked === true ? { locked: true } : {}),
      }),
    ),
    source: row.source,
    updatedAt: row.updatedAt,
  };
}
