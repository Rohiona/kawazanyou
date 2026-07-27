import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import {
  findBudgetTemplate,
  saveBudgetTemplate,
  seedImportedBudgetTemplate,
} from "../../../db/budget-template-store";
import { normalizeBudgetTemplate } from "../../../lib/budget-template-input";

type TemplateEnv = Pick<
  Cloudflare.Env,
  | "DB"
  | "KAWAZANYOU_LOCAL_AUTH_ENABLED"
  | "KAWAZANYOU_LOCAL_USER_EMAIL"
  | "KAWAZANYOU_LOCAL_USER_FULL_NAME"
>;

export async function GET(request: Request, env: TemplateEnv) {
  const user = getChatGPTUser(request, env);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb(env.DB);
    await seedImportedBudgetTemplate(db, user.email);
    return Response.json({ template: await findBudgetTemplate(db, user.email) });
  } catch (error) {
    return databaseError(error);
  }
}

export async function PUT(request: Request, env: TemplateEnv) {
  const user = getChatGPTUser(request, env);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const template = normalizeBudgetTemplate(
    await request.json().catch(() => null),
  );
  if (!template) {
    return Response.json({ error: "Invalid budget template" }, { status: 400 });
  }

  try {
    const db = getDb(env.DB);
    return Response.json({
      template: await saveBudgetTemplate(db, user.email, template),
    });
  } catch (error) {
    return databaseError(error);
  }
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const unavailable = message.includes("no such table");
  return Response.json(
    {
      error: unavailable
        ? "予算テンプレートの保存領域を準備しています。少し待ってから再読み込みしてください。"
        : "予算テンプレートの保存処理でエラーが発生しました。",
    },
    { status: 500 },
  );
}
