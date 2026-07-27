export const STANDARD_CONSUMPTION_TAX_PERCENT = 10;

export const simplifiedTaxCategories = [
  { id: 1, label: "第1種：卸売業", deemedPurchaseRate: 90 },
  { id: 2, label: "第2種：小売業・飲食料品の農林漁業", deemedPurchaseRate: 80 },
  { id: 3, label: "第3種：製造業・建設業など", deemedPurchaseRate: 70 },
  { id: 4, label: "第4種：飲食店業・その他", deemedPurchaseRate: 60 },
  { id: 5, label: "第5種：サービス業・運輸通信業など", deemedPurchaseRate: 50 },
  { id: 6, label: "第6種：不動産業", deemedPurchaseRate: 40 },
] as const;

export type SimplifiedTaxCategory =
  (typeof simplifiedTaxCategories)[number]["id"];

export const DEFAULT_SIMPLIFIED_TAX_CATEGORY: SimplifiedTaxCategory = 5;

export function normalizeSimplifiedTaxCategory(
  value: unknown,
): SimplifiedTaxCategory {
  const category = Number(value);
  return simplifiedTaxCategories.some((item) => item.id === category)
    ? (category as SimplifiedTaxCategory)
    : DEFAULT_SIMPLIFIED_TAX_CATEGORY;
}

export function getSimplifiedTaxCategory(
  category: SimplifiedTaxCategory,
) {
  return (
    simplifiedTaxCategories.find((item) => item.id === category) ??
    simplifiedTaxCategories[DEFAULT_SIMPLIFIED_TAX_CATEGORY - 1]
  );
}

export function calculateSimplifiedConsumptionTax(
  taxIncludedSales: number,
  category: SimplifiedTaxCategory,
): number {
  if (!Number.isFinite(taxIncludedSales) || taxIncludedSales <= 0) return 0;
  const deemedPurchaseRate = getSimplifiedTaxCategory(category).deemedPurchaseRate;
  const salesTax = taxIncludedSales * (
    STANDARD_CONSUMPTION_TAX_PERCENT /
    (100 + STANDARD_CONSUMPTION_TAX_PERCENT)
  );
  return Math.round(salesTax * (1 - deemedPurchaseRate / 100));
}
