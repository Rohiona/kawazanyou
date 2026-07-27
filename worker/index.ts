import { Hono } from "hono";
import { GET as getPlans, PUT as putPlan } from "../app/api/plans/route";
import {
  GET as getTemplate,
  PUT as putTemplate,
} from "../app/api/template/route";
import { getChatGPTUser } from "../app/chatgpt-auth";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.get("/api/session", (c) => {
  const user = getChatGPTUser(c.req.raw, c.env);
  return c.json({ user });
});

app.get("/api/plans", (c) => getPlans(c.req.raw, c.env));
app.put("/api/plans", (c) => putPlan(c.req.raw, c.env));
app.get("/api/template", (c) => getTemplate(c.req.raw, c.env));
app.put("/api/template", (c) => putTemplate(c.req.raw, c.env));

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
