import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

async function request(path = "/", headers = {}) {
  const worker = await loadWorker();
  const html = await readFile(
    new URL("../dist/client/index.html", import.meta.url),
    "utf8",
  );

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers }),
    {
      ASSETS: {
        fetch: async () =>
          new Response(html, {
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("serves the React application shell", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>皮算用/);
  assert.match(html, /id="root"/);
  assert.match(html, /og\.png/);
  assert.match(html, /\/assets\/index-/);
});

test("returns an anonymous session without exposing dashboard data", async () => {
  const response = await request("/api/session");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: null });
});

test("returns the authenticated ChatGPT session", async () => {
  const response = await request("/api/session", {
    "oai-authenticated-user-email": "owner@example.com",
    "oai-authenticated-user-full-name": encodeURIComponent("テスト利用者"),
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: {
      displayName: "テスト利用者",
      email: "owner@example.com",
      fullName: "テスト利用者",
    },
  });
});

test("protects plan and template APIs on the Worker", async () => {
  const [plans, template] = await Promise.all([
    request("/api/plans?year=2026"),
    request("/api/template"),
  ]);
  assert.equal(plans.status, 401);
  assert.equal(template.status, 401);
});

test("validates the plan year before touching D1", async () => {
  const response = await request("/api/plans?year=1999", {
    "oai-authenticated-user-email": "owner@example.com",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid year" });
});
