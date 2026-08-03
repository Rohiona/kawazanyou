import assert from "node:assert/strict";
import test from "node:test";
import {
  currentPlanPeriod,
  planPeriodFromSearch,
  planPeriodHref,
} from "../lib/plan-period-url.ts";

test("the current local year and month are used when the URL has no period", () => {
  const now = new Date(2026, 7, 3, 12, 0, 0);

  assert.deepEqual(currentPlanPeriod(now), { year: 2026, month: 8 });
  assert.deepEqual(planPeriodFromSearch("", currentPlanPeriod(now)), {
    year: 2026,
    month: 8,
  });
});

test("a shared URL opens its specified year and month", () => {
  assert.deepEqual(
    planPeriodFromSearch("?year=2025&month=11", { year: 2026, month: 8 }),
    { year: 2025, month: 11 },
  );
});

test("invalid URL values fall back independently to the current period", () => {
  assert.deepEqual(
    planPeriodFromSearch("?year=1999&month=7", { year: 2026, month: 8 }),
    { year: 2026, month: 7 },
  );
  assert.deepEqual(
    planPeriodFromSearch("?year=2027&month=13", { year: 2026, month: 8 }),
    { year: 2027, month: 8 },
  );
});

test("the current period uses the stable root URL", () => {
  const current = { year: 2026, month: 8 };

  assert.equal(planPeriodHref(current, current), "/");
});

test("other periods keep bookmarkable year and month parameters", () => {
  const current = { year: 2026, month: 8 };

  assert.equal(
    planPeriodHref({ year: 2026, month: 7 }, current),
    "/?year=2026&month=7",
  );
});
