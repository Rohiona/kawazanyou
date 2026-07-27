const MAX_MONEY = 1_000_000_000;
const moneyFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 0,
});

export function normalizeMoneyText(value: string): string {
  return value
    .replace(/[０-９]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
    )
    .replace(/[^0-9]/g, "");
}

export function moneyFromText(value: string): number {
  const normalized = normalizeMoneyText(value);
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.min(MAX_MONEY, parsed) : 0;
}

export function formatMoneyText(value: number, withYen = false): string {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  const formatted = moneyFormatter.format(Math.abs(amount));
  if (!withYen) return `${amount < 0 ? "-" : ""}${formatted}`;
  return `${amount < 0 ? "-" : ""}¥ ${formatted}`;
}
