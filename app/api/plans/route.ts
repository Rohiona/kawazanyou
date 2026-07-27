import { and, asc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { appMeta, monthlyPlans } from "../../../db/schema";
import { imported2026Template } from "../../../db/imported-template";
import {
  findBudgetTemplate,
  saveBudgetTemplate,
  saveSimplifiedTaxCategory,
  seedImportedBudgetTemplate,
} from "../../../db/budget-template-store";
import type { MonthlyPlan } from "../../../lib/budget";
import { mergeMizuhoOjiAllocations } from "../../../lib/allocation-account-merge";
import { normalizeMonthlyPlan } from "../../../lib/monthly-plan-input";
import { repairMonthlyPlanFromImport } from "../../../lib/import-repair";
import { normalizeSimplifiedTaxCategory } from "../../../lib/consumption-tax";
import { synchronizeMonthlyPlan } from "../../../lib/plan-calculations";
import {
  migrateBillingTemplate,
  migrateJulyWorkbookBilling,
} from "../../../lib/billing-model-migration";

const IMPORT_OWNER_KEY = "excel_import_owner";
const WORKBOOK_REPAIR_KEY = "excel_workbook_sections_repair_v2";
const MIZUHO_OJI_MERGE_KEY = "excel_mizuho_oji_merge_v1";
const BILLING_MODEL_MIGRATION_KEY = "billing_model_separation_v1";

type PlansEnv = Pick<
  Cloudflare.Env,
  | "DB"
  | "IMPORT_CLAIM_TOKEN"
  | "KAWAZANYOU_LOCAL_AUTH_ENABLED"
  | "KAWAZANYOU_LOCAL_USER_EMAIL"
  | "KAWAZANYOU_LOCAL_USER_FULL_NAME"
>;

export async function GET(request: Request, env: PlansEnv) {
  const user = getChatGPTUser(request, env);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const year = readYear(searchParams.get("year"));
  if (year === null) {
    return Response.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const db = getDb(env.DB);
    await seedImportedWorkbook(
      db,
      user.email,
      searchParams.get("claim"),
      env.IMPORT_CLAIM_TOKEN,
    );
    await seedImportedBudgetTemplate(db, user.email);
    await mergeImportedMizuhoAccounts(db, user.email);
    await migrateImportedBillingModel(db, user.email);
    const rows = await db
      .select()
      .from(monthlyPlans)
      .where(
        and(
          eq(monthlyPlans.ownerEmail, user.email),
          eq(monthlyPlans.year, year),
        ),
      )
      .orderBy(asc(monthlyPlans.month));

    return Response.json({
      plans: rows.map(toMonthlyPlan),
      template: await findBudgetTemplate(db, user.email),
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function PUT(request: Request, env: PlansEnv) {
  const user = getChatGPTUser(request, env);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const plan = normalizeMonthlyPlan(await request.json().catch(() => null));
  if (!plan) {
    return Response.json({ error: "Invalid monthly plan" }, { status: 400 });
  }

  try {
    const db = getDb(env.DB);
    const values = toDatabaseValues(user.email, plan);
    const [saved] = await db
      .insert(monthlyPlans)
      .values(values)
      .onConflictDoUpdate({
        target: [
          monthlyPlans.ownerEmail,
          monthlyPlans.year,
          monthlyPlans.month,
        ],
        set: values,
      })
      .returning();
    await saveSimplifiedTaxCategory(
      db,
      user.email,
      plan.simplifiedTaxCategory,
    );

    return Response.json({ plan: toMonthlyPlan(saved) });
  } catch (error) {
    return databaseError(error);
  }
}

async function seedImportedWorkbook(
  db: Awaited<ReturnType<typeof getDb>>,
  email: string,
  claimToken: string | null,
  expectedClaimToken: string | undefined,
) {
  let [claim] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, IMPORT_OWNER_KEY))
    .limit(1);

  const hasValidClaimToken =
    Boolean(expectedClaimToken) && claimToken === expectedClaimToken;

  if (hasValidClaimToken && claim?.value !== email) {
    await db
      .insert(appMeta)
      .values({ key: IMPORT_OWNER_KEY, value: email })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: { value: email },
      });
    [claim] = await db
      .select()
      .from(appMeta)
      .where(eq(appMeta.key, IMPORT_OWNER_KEY))
      .limit(1);
  }

  if (!claim && !hasValidClaimToken) return;
  if (claim?.value !== email) return;

  const [repair] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, WORKBOOK_REPAIR_KEY))
    .limit(1);
  if (repair?.value === email) return;

  const existingRows = await db
    .select()
    .from(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.ownerEmail, email),
        eq(monthlyPlans.year, 2026),
      ),
    );

  for (const importedPlan of imported2026Template) {
    const existing = existingRows.find((row) => row.month === importedPlan.month);
    const currentPlan = existing ? toMonthlyPlan(existing) : null;
    const repairedPlan = repairMonthlyPlanFromImport(currentPlan, importedPlan);
    if (repairedPlan === currentPlan) continue;

    const values = toDatabaseValues(email, repairedPlan);
    await db
      .insert(monthlyPlans)
      .values(values)
      .onConflictDoUpdate({
        target: [
          monthlyPlans.ownerEmail,
          monthlyPlans.year,
          monthlyPlans.month,
        ],
        set: values,
      });
  }

  await db
    .insert(appMeta)
    .values({ key: WORKBOOK_REPAIR_KEY, value: email })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: { value: email },
    });
}

async function mergeImportedMizuhoAccounts(
  db: Awaited<ReturnType<typeof getDb>>,
  email: string,
) {
  const [claim] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, IMPORT_OWNER_KEY))
    .limit(1);
  if (claim?.value !== email) return;

  const [migration] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, MIZUHO_OJI_MERGE_KEY))
    .limit(1);
  if (migration?.value === email) return;

  const rows = await db
    .select()
    .from(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.ownerEmail, email),
        eq(monthlyPlans.year, 2026),
      ),
    );

  for (const row of rows) {
    const current = JSON.parse(
      row.allocationItems,
    ) as MonthlyPlan["allocationItems"];
    const merged = mergeMizuhoOjiAllocations(current);
    if (merged === current) continue;

    await db
      .update(monthlyPlans)
      .set({ allocationItems: JSON.stringify(merged) })
      .where(eq(monthlyPlans.id, row.id));
  }

  await db
    .insert(appMeta)
    .values({ key: MIZUHO_OJI_MERGE_KEY, value: email })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: { value: email },
    });
}

async function migrateImportedBillingModel(
  db: Awaited<ReturnType<typeof getDb>>,
  email: string,
) {
  const [claim] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, IMPORT_OWNER_KEY))
    .limit(1);
  if (claim?.value !== email) return;

  const [migration] = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, BILLING_MODEL_MIGRATION_KEY))
    .limit(1);
  if (migration?.value === email) return;

  const [julyRow] = await db
    .select()
    .from(monthlyPlans)
    .where(
      and(
        eq(monthlyPlans.ownerEmail, email),
        eq(monthlyPlans.year, 2026),
        eq(monthlyPlans.month, 7),
      ),
    )
    .limit(1);

  if (julyRow) {
    const migrated = migrateJulyWorkbookBilling(toMonthlyPlan(julyRow));
    await db
      .update(monthlyPlans)
      .set({
        householdItems: JSON.stringify(migrated.householdItems),
        paymentItems: JSON.stringify(migrated.paymentItems),
        allocationItems: JSON.stringify(migrated.allocationItems),
      })
      .where(eq(monthlyPlans.id, julyRow.id));
  }

  const template = await findBudgetTemplate(db, email);
  if (template) {
    await saveBudgetTemplate(db, email, migrateBillingTemplate(template));
  }

  await db
    .insert(appMeta)
    .values({ key: BILLING_MODEL_MIGRATION_KEY, value: email })
    .onConflictDoUpdate({
      target: appMeta.key,
      set: { value: email },
    });
}

function toDatabaseValues(ownerEmail: string, plan: MonthlyPlan) {
  return {
    ownerEmail,
    year: plan.year,
    month: plan.month,
    grossIncome: plan.grossIncome,
    taxReservePercent: plan.taxReservePercent,
    consumptionTaxPercent: 10,
    simplifiedTaxCategory: plan.simplifiedTaxCategory,
    householdItems: JSON.stringify(plan.householdItems),
    paymentItems: JSON.stringify(plan.paymentItems),
    allocationItems: JSON.stringify(plan.allocationItems),
    memo: plan.memo,
    updatedAt: plan.updatedAt,
  };
}

function toMonthlyPlan(row: typeof monthlyPlans.$inferSelect): MonthlyPlan {
  const householdItems = JSON.parse(row.householdItems).map(
    (item: { id: string; name: string; budget: number; locked?: unknown }) => ({
      id: item.id,
      name: item.name,
      budget: item.budget,
      ...(item.locked === true ? { locked: true } : {}),
    }),
  );
  const paymentItems = JSON.parse(row.paymentItems).map(
    (item: { id: string; name: string; actual: number; locked?: unknown }) => ({
      id: item.id,
      name: item.name,
      actual: item.actual,
      ...(item.locked === true ? { locked: true } : {}),
    }),
  );
  return synchronizeMonthlyPlan({
    year: row.year,
    month: row.month,
    grossIncome: row.grossIncome,
    taxReservePercent: row.taxReservePercent,
    consumptionTaxPercent: 10,
    simplifiedTaxCategory: normalizeSimplifiedTaxCategory(
      row.simplifiedTaxCategory,
    ),
    householdItems,
    paymentItems,
    allocationItems: JSON.parse(row.allocationItems),
    memo: row.memo,
    updatedAt: row.updatedAt,
  });
}

function readYear(value: string | null): number | null {
  const year = Number(value ?? 2026);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const unavailable = message.includes("no such table");
  return Response.json(
    {
      error: unavailable
        ? "保存領域を準備しています。少し待ってから再読み込みしてください。"
        : "保存処理でエラーが発生しました。",
    },
    { status: 500 },
  );
}
