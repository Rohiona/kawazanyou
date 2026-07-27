import type { AllocationItem, PaymentItem } from "./budget.ts";

export const TAX_RESERVE_SOURCE_ID = "system:tax-reserve";
export const CONSUMPTION_TAX_SOURCE_ID = "system:consumption-tax";
const PAYMENT_SOURCE_PREFIX = "payment:";

export type AllocationAmounts = {
  taxReserve: number;
  consumptionTaxReserve: number;
};

export function paymentSourceId(paymentGroupId: string): string {
  return `${PAYMENT_SOURCE_PREFIX}${paymentGroupId}`;
}

export function normalizeAllocationSourceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 140))
        .filter(Boolean),
    ),
  ).slice(0, 100);
}

export function calculateAllocationAmounts(
  allocationItems: AllocationItem[],
  paymentItems: PaymentItem[],
  amounts: AllocationAmounts,
): AllocationItem[] {
  const sourceAmounts = new Map<string, number>([
    [TAX_RESERVE_SOURCE_ID, finiteMoney(amounts.taxReserve)],
    [
      CONSUMPTION_TAX_SOURCE_ID,
      finiteMoney(amounts.consumptionTaxReserve),
    ],
    ...paymentItems.map(
      (item) => [paymentSourceId(item.id), finiteMoney(item.actual)] as const,
    ),
  ]);

  return allocationItems.map((item) => ({
    ...item,
    sourceIds: normalizeAllocationSourceIds(item.sourceIds),
    amount: normalizeAllocationSourceIds(item.sourceIds).reduce(
      (sum, sourceId) => sum + (sourceAmounts.get(sourceId) ?? 0),
      0,
    ),
  }));
}

export function removePaymentSourceFromAllocations<
  T extends { sourceIds?: string[] },
>(
  allocationItems: T[],
  paymentGroupId: string,
): T[] {
  const sourceId = paymentSourceId(paymentGroupId);
  return allocationItems.map((item) => ({
    ...item,
    sourceIds: normalizeAllocationSourceIds(item.sourceIds).filter(
      (candidate) => candidate !== sourceId,
    ),
  }));
}

export function assignAllocationSources<
  T extends { id: string; sourceIds?: string[] },
>(items: T[], targetId: string, sourceIds: string[]): T[] {
  const normalized = normalizeAllocationSourceIds(sourceIds);
  const assigned = new Set(normalized);

  return items.map((item) => ({
    ...item,
    sourceIds:
      item.id === targetId
        ? normalized
        : normalizeAllocationSourceIds(item.sourceIds).filter(
            (sourceId) => !assigned.has(sourceId),
          ),
  }));
}

export function remapAllocationSourceIds(
  sourceIds: unknown,
  paymentIdMap: Map<string, string>,
): string[] {
  return normalizeAllocationSourceIds(sourceIds).flatMap((sourceId) => {
    if (!sourceId.startsWith(PAYMENT_SOURCE_PREFIX)) return [sourceId];
    const remapped = paymentIdMap.get(sourceId.slice(PAYMENT_SOURCE_PREFIX.length));
    return remapped ? [paymentSourceId(remapped)] : [];
  });
}

function finiteMoney(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}
