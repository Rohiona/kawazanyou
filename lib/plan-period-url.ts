export type PlanPeriod = {
  year: number;
  month: number;
};

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export function currentPlanPeriod(now = new Date()): PlanPeriod {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function planPeriodFromSearch(
  search: string,
  fallback = currentPlanPeriod(),
): PlanPeriod {
  const params = new URLSearchParams(search);
  return {
    year: integerInRange(params.get("year"), MIN_YEAR, MAX_YEAR) ?? fallback.year,
    month: integerInRange(params.get("month"), 1, 12) ?? fallback.month,
  };
}

export function planPeriodHref({ year, month }: PlanPeriod): string {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  return `/?${params}`;
}

function integerInRange(value: string | null, min: number, max: number) {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}
