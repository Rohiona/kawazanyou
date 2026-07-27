import type { AllocationItem } from "./budget.ts";
import { normalizeAllocationSourceIds } from "./allocation-groups.ts";

const AOYAMA_ACCOUNT_NAME = "みずほ（青山）";
const OJI_ACCOUNT_NAME = "みずほ（王子）";

export function mergeMizuhoOjiAllocations(
  items: AllocationItem[],
): AllocationItem[] {
  const targetIndexes = items.flatMap((item, index) =>
    item.name === AOYAMA_ACCOUNT_NAME || item.name === OJI_ACCOUNT_NAME
      ? [index]
      : [],
  );
  const hasAoyama = items.some((item) => item.name === AOYAMA_ACCOUNT_NAME);

  if (!hasAoyama) return items;

  const firstTargetIndex = targetIndexes[0];
  const oji = items.find((item) => item.name === OJI_ACCOUNT_NAME);
  const firstTarget = items[firstTargetIndex];
  const sourceIds = Array.from(
    new Set(
      targetIndexes.flatMap((index) =>
        normalizeAllocationSourceIds(items[index].sourceIds),
      ),
    ),
  );
  const merged: AllocationItem = {
    ...(oji ?? firstTarget),
    name: OJI_ACCOUNT_NAME,
    amount: targetIndexes.reduce(
      (sum, index) => sum + items[index].amount,
      0,
    ),
    ...(sourceIds.length > 0 ? { sourceIds } : {}),
  };

  return items.flatMap((item, index) => {
    if (index === firstTargetIndex) return [merged];
    if (targetIndexes.includes(index)) return [];
    return [item];
  });
}
