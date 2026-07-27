import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const monthlyPlans = sqliteTable(
  "monthly_plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerEmail: text("owner_email").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    grossIncome: integer("gross_income").notNull().default(0),
    taxReservePercent: real("tax_reserve_percent").notNull().default(30),
    consumptionTaxPercent: real("consumption_tax_percent")
      .notNull()
      .default(10),
    simplifiedTaxCategory: integer("simplified_tax_category")
      .notNull()
      .default(5),
    householdItems: text("household_items").notNull().default("[]"),
    paymentItems: text("payment_items").notNull().default("[]"),
    allocationItems: text("allocation_items").notNull().default("[]"),
    memo: text("memo").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("monthly_plans_owner_period_idx").on(
      table.ownerEmail,
      table.year,
      table.month,
    ),
  ],
);

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const budgetTemplates = sqliteTable(
  "budget_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ownerEmail: text("owner_email").notNull(),
    taxReservePercent: real("tax_reserve_percent").notNull().default(30),
    consumptionTaxPercent: real("consumption_tax_percent")
      .notNull()
      .default(10),
    simplifiedTaxCategory: integer("simplified_tax_category")
      .notNull()
      .default(5),
    householdItems: text("household_items").notNull().default("[]"),
    paymentItems: text("payment_items").notNull().default("[]"),
    allocationItems: text("allocation_items").notNull().default("[]"),
    source: text("source").notNull().default("手動作成"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("budget_templates_owner_idx").on(table.ownerEmail),
  ],
);
