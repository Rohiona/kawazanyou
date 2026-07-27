import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateAnnualTotals,
  calculateMonthlySummary,
  createEmptyMonth,
  type AllocationItem,
  type BudgetItem,
  type MonthlyPlan,
  type PaymentItem,
} from "../lib/budget";
import {
  copyPlanBudget,
  createPlanFromTemplate,
  createTemplateFromPlan,
  type AllocationDestination,
  type BudgetTemplate,
} from "../lib/budget-template";
import {
  formatMoneyText,
  moneyFromText,
  normalizeMoneyText,
} from "../lib/money-input";
import {
  getSimplifiedTaxCategory,
  simplifiedTaxCategories,
  STANDARD_CONSUMPTION_TAX_PERCENT,
  type SimplifiedTaxCategory,
} from "../lib/consumption-tax";
import {
  assignAllocationSources,
  CONSUMPTION_TAX_SOURCE_ID,
  paymentSourceId,
  removePaymentSourceFromAllocations,
  TAX_RESERVE_SOURCE_ID,
} from "../lib/allocation-groups";
import { synchronizeMonthlyPlan } from "../lib/plan-calculations";
import {
  moveRow,
  setRowLocked,
  type RowMoveDirection,
} from "../lib/row-order";

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const yen = { format: (value: number) => formatMoneyText(value, true) };

type Props = {
  displayName: string;
  email: string;
  signOutHref: string;
  claimToken: string;
};

export function Dashboard({ displayName, email, signOutHref, claimToken }: Props) {
  const [year, setYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [plans, setPlans] = useState<MonthlyPlan[]>([]);
  const [savedMonths, setSavedMonths] = useState<number[]>([]);
  const [budgetTemplate, setBudgetTemplate] = useState<BudgetTemplate | null>(null);
  const [templateDraft, setTemplateDraft] = useState<BudgetTemplate | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const search = new URLSearchParams({ year: String(year) });
    if (claimToken) search.set("claim", claimToken);
    fetch(`/api/plans?${search}`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          error?: string;
          plans?: MonthlyPlan[];
          template?: BudgetTemplate | null;
        };
        if (!response.ok) throw new Error(payload.error ?? "読み込めませんでした");
        return {
          plans: payload.plans ?? [],
          template: payload.template ?? null,
        };
      })
      .then(({ plans: loadedPlans, template }) => {
        if (!active) return;
        setPlans(loadedPlans);
        setSavedMonths(loadedPlans.map((plan) => plan.month));
        setBudgetTemplate(template);
        setTemplateDraft(null);
        setTemplateOpen(false);
        setStatus("ready");
        if (claimToken) window.history.replaceState({}, "", "/");
      })
      .catch((error: Error) => {
        if (!active) return;
        setMessage(error.message);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [year, claimToken]);

  const activePlan = useMemo(
    () =>
      plans.find((plan) => plan.month === selectedMonth) ??
      (budgetTemplate
        ? createPlanFromTemplate(budgetTemplate, year, selectedMonth)
        : createEmptyMonth(year, selectedMonth)),
    [budgetTemplate, plans, selectedMonth, year],
  );
  const isSavedMonth = savedMonths.includes(selectedMonth);
  const summary = calculateMonthlySummary(activePlan);
  const allocationSources = createAllocationSources(activePlan, summary);
  const selectedTaxCategory = getSimplifiedTaxCategory(
    activePlan.simplifiedTaxCategory,
  );
  const billingTotal = activePlan.paymentItems.reduce(
    (sum, item) => sum + item.actual,
    0,
  );
  const annual = calculateAnnualTotals(plans);

  function changeYear(nextYear: number) {
    setStatus("loading");
    setMessage("");
    setYear(nextYear);
  }

  function replaceActivePlan(nextPlan: MonthlyPlan) {
    const synchronized = synchronizeMonthlyPlan(nextPlan);
    setPlans((current) => {
      const exists = current.some((plan) => plan.month === selectedMonth);
      return exists
        ? current.map((plan) => (plan.month === selectedMonth ? synchronized : plan))
        : [...current, synchronized].sort((a, b) => a.month - b.month);
    });
    setStatus("ready");
    setMessage("");
  }

  function changePlan(change: (plan: MonthlyPlan) => MonthlyPlan) {
    setPlans((current) => {
      const existing = current.some((plan) => plan.month === selectedMonth);
      const nextPlan = synchronizeMonthlyPlan(change(
        current.find((plan) => plan.month === selectedMonth) ?? activePlan,
      ));
      return existing
        ? current.map((plan) => (plan.month === selectedMonth ? nextPlan : plan))
        : [...current, nextPlan].sort((a, b) => a.month - b.month);
    });
    setStatus("ready");
    setMessage("");
  }

  function openTemplateEditor() {
    setTemplateDraft(
      structuredClone(
        budgetTemplate ?? createTemplateFromPlan(activePlan, "新規テンプレート"),
      ),
    );
    setTemplateOpen(true);
  }

  async function persistTemplate(template: BudgetTemplate, successMessage: string) {
    setTemplateSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/template", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(template),
      });
      const payload = (await response.json()) as {
        error?: string;
        template?: BudgetTemplate;
      };
      if (!response.ok) throw new Error(payload.error ?? "テンプレートを保存できませんでした");
      if (!payload.template) throw new Error("保存結果を確認できませんでした");
      setBudgetTemplate(payload.template);
      setTemplateDraft(structuredClone(payload.template));
      setTemplateOpen(false);
      setStatus("ready");
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "テンプレートを保存できませんでした");
      setStatus("error");
    } finally {
      setTemplateSaving(false);
    }
  }

  function reapplyTemplate() {
    if (!budgetTemplate) {
      setMessage("先に予算テンプレートを作成してください");
      return;
    }
    replaceActivePlan(createPlanFromTemplate(budgetTemplate, year, selectedMonth));
    setMessage(`${selectedMonth}月にテンプレートを再適用しました。月次保存で確定してください`);
  }

  function copyPreviousMonth() {
    const previous = plans.find((plan) => plan.month === selectedMonth - 1);
    if (!previous) {
      setMessage("コピーできる前月データがありません");
      return;
    }
    replaceActivePlan(copyPlanBudget(previous, year, selectedMonth));
    setMessage(`${selectedMonth - 1}月の予算をコピーしました。確定請求額と報酬は0に戻しています`);
  }

  async function savePlan() {
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/plans", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(activePlan),
      });
      const payload = (await response.json()) as { error?: string; plan?: MonthlyPlan };
      if (!response.ok) throw new Error(payload.error ?? "保存できませんでした");
      if (!payload.plan) throw new Error("保存結果を確認できませんでした");
      const saved = payload.plan;
      setPlans((current) =>
        current.map((plan) => (plan.month === saved.month ? saved : plan)),
      );
      setSavedMonths((current) =>
        current.includes(saved.month) ? current : [...current, saved.month],
      );
      setStatus("saved");
      setMessage(`${selectedMonth}月分を保存しました`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "保存できませんでした");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="皮算用 ホーム">
          <span className="brand-mark">皮</span>
          <span>皮算用</span>
        </a>
        <div className="account-menu">
          <span className="account-avatar">{displayName.slice(0, 1)}</span>
          <span className="account-copy">
            <strong>{displayName}</strong>
            <small>{email}</small>
          </span>
          <a className="text-link" href={signOutHref}>ログアウト</a>
        </div>
      </header>

      <section className="dashboard-hero" id="top">
        <div>
          <p className="eyebrow">FREELANCE MONEY PLANNER</p>
          <h1>今月のお金を、<br />迷わず振り分ける。</h1>
          <p className="hero-copy">
            報酬を入力すると、税金の確保額・家計予算・残せる金額を自動計算します。
          </p>
        </div>
        <div className="year-control" aria-label="表示する年">
          <button type="button" onClick={() => changeYear(year - 1)} aria-label="前年">−</button>
          <strong>{year}</strong>
          <button type="button" onClick={() => changeYear(year + 1)} aria-label="翌年">＋</button>
          <span>年</span>
        </div>
      </section>

      <section className="annual-strip" aria-label={`${year}年の年間集計`}>
        <Metric label="年間報酬" value={annual.grossIncome} tone="ink" />
        <Metric label="税金確保" value={annual.taxReserve} tone="coral" />
        <Metric label="家計予算" value={annual.householdBudget} tone="sage" />
        <div className="annual-chart" aria-label="月別報酬グラフ">
          {MONTHS.map((month) => {
            const income = plans.find((plan) => plan.month === month)?.grossIncome ?? 0;
            const max = Math.max(...plans.map((plan) => plan.grossIncome), 1);
            return (
              <button
                className={month === selectedMonth ? "bar active" : "bar"}
                key={month}
                type="button"
                onClick={() => setSelectedMonth(month)}
                title={`${month}月 ${yen.format(income)}`}
              >
                <span style={{ height: `${Math.max(8, (income / max) * 100)}%` }} />
                <small>{month}</small>
              </button>
            );
          })}
        </div>
      </section>

      <nav className="month-tabs" aria-label="月を選択">
        {MONTHS.map((month) => (
          <button
            className={month === selectedMonth ? "selected" : ""}
            key={month}
            type="button"
            onClick={() => setSelectedMonth(month)}
          >
            {month}月
          </button>
        ))}
      </nav>

      {status === "loading" ? (
        <section className="loading-panel">年間データを読み込んでいます…</section>
      ) : (
        <>
          <section className="template-toolbar panel" aria-label="毎月の予算テンプレート">
            <div>
              <span className="template-kicker">MONTHLY TEMPLATE</span>
              <strong>毎月の予算テンプレート</strong>
              <small>
                {budgetTemplate
                  ? `${budgetTemplate.source}の家計予算・請求先・振り分け先を、新しい月へ自動適用します`
                  : "家計予算・請求先・振り分け先の別名を保存できます"}
              </small>
            </div>
            <div className="template-actions">
              <button type="button" onClick={copyPreviousMonth}>前月からコピー</button>
              <button type="button" onClick={reapplyTemplate} disabled={!budgetTemplate}>再適用</button>
              <button type="button" onClick={() => persistTemplate(createTemplateFromPlan(activePlan), `${selectedMonth}月の内容をテンプレートに保存しました`)}>今月をテンプレートに保存</button>
              <button className="template-edit-button" type="button" onClick={openTemplateEditor}>テンプレートを編集</button>
            </div>
          </section>

          {templateOpen && templateDraft && (
            <TemplateEditor
              template={templateDraft}
              saving={templateSaving}
              onChange={setTemplateDraft}
              onCancel={() => setTemplateOpen(false)}
              onSave={() => persistTemplate(templateDraft, "予算テンプレートを保存しました")}
            />
          )}

          <section className="income-grid">
            <div className="income-form panel">
              <div className="section-heading">
                <div><span className="step">01</span><h2>{selectedMonth}月の報酬</h2></div>
                <span className="import-badge">
                  {isSavedMonth ? "保存済み" : budgetTemplate ? "テンプレート適用中" : "新規"}
                </span>
              </div>
              <label className="field large-field">
                <span>振込報酬（税込）</span>
                <span className="money-input"><b>¥</b><MoneyNumberInput label="振込報酬（税込）" value={activePlan.grossIncome} onChange={(grossIncome) => changePlan((plan) => ({ ...plan, grossIncome }))} /></span>
              </label>
              <div className="rate-grid tax-settings-grid">
                <label className="field"><span>税金確保率</span><span className="suffix-input"><input type="number" min="0" max="100" step="0.1" value={activePlan.taxReservePercent} onChange={(event) => changePlan((plan) => ({ ...plan, taxReservePercent: numberValue(event.target.value) }))} /><b>%</b></span></label>
                <label className="field"><span>消費税率</span><output className="fixed-rate">{STANDARD_CONSUMPTION_TAX_PERCENT}%</output></label>
                <label className="field tax-category-field">
                  <span>簡易課税の事業区分</span>
                  <select
                    value={activePlan.simplifiedTaxCategory}
                    onChange={(event) => changePlan((plan) => ({
                      ...plan,
                      consumptionTaxPercent: STANDARD_CONSUMPTION_TAX_PERCENT,
                      simplifiedTaxCategory: Number(event.target.value) as SimplifiedTaxCategory,
                    }))}
                  >
                    {simplifiedTaxCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.label}（みなし仕入率 {category.deemedPurchaseRate}%）</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="legal-note">業種別の計算は簡易課税制度のみなし仕入率を使った資金確保用の概算です。軽減税率8%の対象判定ではありません。簡易課税の適用可否や実際の申告額は税理士・税務署へご確認ください。</p>
            </div>

            <div className="result-stack">
              <ResultCard label="税金として確保" value={summary.taxReserve} detail="千円単位で切り上げ" tone="coral" />
              <ResultCard label="税引後の使用可能額" value={summary.netAfterTaxReserve} detail={`消費税納付見込 ${yen.format(summary.consumptionTaxReserve)}・${selectedTaxCategory.label}`} tone="ink" />
              <ResultCard label="家計予算を引いた余裕" value={summary.householdCushion} detail={`家計予算 ${yen.format(summary.householdBudget)}`} tone="sage" />
            </div>
          </section>

          <div className="stacked-sections">
            <EditableSection
              layout="billing"
              number="02"
              title="請求・引落額"
              description="カード明細や口座引落で確定した金額を入力します"
              total={billingTotal}
              headers={["支払方法・請求先", "確定額"]}
              onAdd={() => changePlan((plan) => ({ ...plan, paymentItems: [...plan.paymentItems, newPaymentItem()] }))}
            >
              {activePlan.paymentItems.map((item, index) => (
                <PaymentRow
                  key={item.id}
                  item={item}
                  index={index}
                  count={activePlan.paymentItems.length}
                  onChange={(next) => changePlan((plan) => ({ ...plan, paymentItems: replaceItem(plan.paymentItems, next) }))}
                  onMove={(direction) => changePlan((plan) => ({ ...plan, paymentItems: moveRow(plan.paymentItems, item.id, direction) }))}
                  onToggleLock={() => changePlan((plan) => ({ ...plan, paymentItems: setRowLocked(plan.paymentItems, item.id, !item.locked) }))}
                  onDelete={() => changePlan((plan) => ({ ...plan, paymentItems: removeItem(plan.paymentItems, item.id), allocationItems: removePaymentSourceFromAllocations(plan.allocationItems, item.id) }))}
                />
              ))}
            </EditableSection>

            <EditableSection
              layout="allocation"
              number="03"
              title="口座への振り分け"
              description="選択した請求・引落額と税金を自動合算。未指定は0円"
              total={summary.allocationTotal}
              headers={["振り分け先", "請求・引落の選択", "金額（自動）"]}
              onAdd={() => changePlan((plan) => ({ ...plan, allocationItems: [...plan.allocationItems, newAllocationItem()] }))}
            >
              {activePlan.allocationItems.map((item, index) => (
                <AllocationRow
                  key={item.id}
                  item={item}
                  index={index}
                  count={activePlan.allocationItems.length}
                  sources={allocationSources}
                  onChange={(next) => changePlan((plan) => ({ ...plan, allocationItems: replaceItem(plan.allocationItems, next) }))}
                  onSourceIdsChange={(sourceIds) => changePlan((plan) => ({ ...plan, allocationItems: assignAllocationSources(plan.allocationItems, item.id, sourceIds) }))}
                  onMove={(direction) => changePlan((plan) => ({ ...plan, allocationItems: moveRow(plan.allocationItems, item.id, direction) }))}
                  onToggleLock={() => changePlan((plan) => ({ ...plan, allocationItems: setRowLocked(plan.allocationItems, item.id, !item.locked) }))}
                  onDelete={() => changePlan((plan) => ({ ...plan, allocationItems: removeItem(plan.allocationItems, item.id) }))}
                />
              ))}
            </EditableSection>
          </div>

          <EditableSection
            layout="budget"
            number="04"
            title="家計への予算"
            description="何にいくら使うかを、支払方法とは分けて管理します"
            total={summary.householdBudget}
            headers={["項目", "予算"]}
            onAdd={() => changePlan((plan) => ({ ...plan, householdItems: [...plan.householdItems, newBudgetItem()] }))}
          >
            {activePlan.householdItems.map((item, index) => (
              <BudgetRow
                key={item.id}
                item={item}
                index={index}
                count={activePlan.householdItems.length}
                onChange={(next) => changePlan((plan) => ({ ...plan, householdItems: replaceItem(plan.householdItems, next) }))}
                onMove={(direction) => changePlan((plan) => ({ ...plan, householdItems: moveRow(plan.householdItems, item.id, direction) }))}
                onToggleLock={() => changePlan((plan) => ({ ...plan, householdItems: setRowLocked(plan.householdItems, item.id, !item.locked) }))}
                onDelete={() => changePlan((plan) => ({ ...plan, householdItems: removeItem(plan.householdItems, item.id) }))}
              />
            ))}
          </EditableSection>

          <section className="memo-panel panel">
            <label className="field"><span>{selectedMonth}月のメモ</span><textarea value={activePlan.memo} placeholder="請求の変動、来月の予定など" onChange={(event) => changePlan((plan) => ({ ...plan, memo: event.target.value }))} /></label>
          </section>

          <div className="save-dock">
            <p className={status === "error" ? "status error" : "status"}>{message || "変更内容は保存ボタンで確定します"}</p>
            <button className="primary-button" type="button" onClick={savePlan} disabled={status === "saving"}>
              {status === "saving" ? "保存中…" : `${selectedMonth}月分を保存`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function TemplateEditor({
  template,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  template: BudgetTemplate;
  saving: boolean;
  onChange: (template: BudgetTemplate) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function changeTemplate(next: BudgetTemplate) {
    onChange(next);
  }

  const householdTotal = template.householdItems.reduce(
    (sum, item) => sum + item.budget,
    0,
  );

  return (
    <section className="template-editor panel">
      <div className="template-editor-heading">
        <div>
          <span className="template-kicker">DEFAULT BUDGET</span>
          <h2>予算テンプレートを編集</h2>
          <p>家計予算・請求先・口座ごとの集計先・簡易課税の事業区分を、新しい月へ引き継ぎます。確定額は毎月0円から始まります。</p>
        </div>
        <button className="template-close" type="button" onClick={onCancel} aria-label="テンプレート編集を閉じる">×</button>
      </div>

      <label className="field template-tax-setting">
        <span>既定の簡易課税事業区分</span>
        <select value={template.simplifiedTaxCategory} onChange={(event) => changeTemplate({ ...template, simplifiedTaxCategory: Number(event.target.value) as SimplifiedTaxCategory })}>
          {simplifiedTaxCategories.map((category) => (
            <option key={category.id} value={category.id}>{category.label}（みなし仕入率 {category.deemedPurchaseRate}%）</option>
          ))}
        </select>
      </label>

      <div className="template-editor-columns">
        <TemplateGroup
          title="家計予算"
          total={householdTotal}
          onAdd={() => changeTemplate({ ...template, householdItems: [...template.householdItems, newBudgetItem()] })}
        >
          {template.householdItems.map((item, index) => (
            <BudgetRow
              key={item.id}
              item={item}
              index={index}
              count={template.householdItems.length}
              onChange={(next) => changeTemplate({ ...template, householdItems: replaceItem(template.householdItems, next) })}
              onMove={(direction) => changeTemplate({ ...template, householdItems: moveRow(template.householdItems, item.id, direction) })}
              onToggleLock={() => changeTemplate({ ...template, householdItems: setRowLocked(template.householdItems, item.id, !item.locked) })}
              onDelete={() => changeTemplate({ ...template, householdItems: removeItem(template.householdItems, item.id) })}
            />
          ))}
        </TemplateGroup>

        <TemplateGroup
          title="請求・引落先"
          onAdd={() => changeTemplate({ ...template, paymentItems: [...template.paymentItems, newPaymentItem()] })}
        >
          {template.paymentItems.map((item, index) => (
            <TemplatePaymentRow
              key={item.id}
              item={item}
              index={index}
              count={template.paymentItems.length}
              onChange={(next) => changeTemplate({ ...template, paymentItems: replaceItem(template.paymentItems, next) })}
              onMove={(direction) => changeTemplate({ ...template, paymentItems: moveRow(template.paymentItems, item.id, direction) })}
              onToggleLock={() => changeTemplate({ ...template, paymentItems: setRowLocked(template.paymentItems, item.id, !item.locked) })}
              onDelete={() => changeTemplate({ ...template, paymentItems: removeItem(template.paymentItems, item.id), allocationDestinations: removePaymentSourceFromAllocations(template.allocationDestinations, item.id) })}
            />
          ))}
        </TemplateGroup>

        <TemplateGroup
          title="振り分け先口座"
          onAdd={() => changeTemplate({ ...template, allocationDestinations: [...template.allocationDestinations, newAllocationDestination()] })}
        >
          {template.allocationDestinations.map((destination, index) => (
            <DestinationRow
              key={destination.id}
              destination={destination}
              index={index}
              count={template.allocationDestinations.length}
              sources={createTemplateAllocationSources(template.paymentItems)}
              onChange={(next) => changeTemplate({ ...template, allocationDestinations: replaceItem(template.allocationDestinations, next) })}
              onSourceIdsChange={(sourceIds) => changeTemplate({ ...template, allocationDestinations: assignAllocationSources(template.allocationDestinations, destination.id, sourceIds) })}
              onMove={(direction) => changeTemplate({ ...template, allocationDestinations: moveRow(template.allocationDestinations, destination.id, direction) })}
              onToggleLock={() => changeTemplate({ ...template, allocationDestinations: setRowLocked(template.allocationDestinations, destination.id, !destination.locked) })}
              onDelete={() => changeTemplate({ ...template, allocationDestinations: removeItem(template.allocationDestinations, destination.id) })}
            />
          ))}
        </TemplateGroup>

      </div>

      <div className="template-editor-footer">
        <button type="button" onClick={onCancel}>キャンセル</button>
        <button className="primary-button" type="button" onClick={onSave} disabled={saving}>
          {saving ? "保存中…" : "テンプレートを保存"}
        </button>
      </div>
    </section>
  );
}

function TemplateGroup({ title, total, onAdd, children }: { title: string; total?: number; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section className="template-group">
      <header><strong>{title}</strong>{total !== undefined && <span>{yen.format(total)}</span>}</header>
      <div className="editable-rows">{children}</div>
      <button className="add-row" type="button" onClick={onAdd}>＋ 項目を追加</button>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{yen.format(value)}</strong></div>;
}

function ResultCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return <article className={`result-card ${tone}`}><span>{label}</span><strong>{yen.format(value)}</strong><small>{detail}</small></article>;
}

function EditableSection({ layout, number, title, description, total, headers, onAdd, children }: { layout: "billing" | "allocation" | "budget"; number: string; title: string; description: string; total?: number; headers: string[]; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section className={`editable-section layout-${layout} panel`}>
      <div className="section-heading">
        <div><span className="step">{number}</span><h2>{title}</h2><p>{description}</p></div>
        {total !== undefined && <div className="section-total"><span>合計</span><strong>{yen.format(total)}</strong></div>}
      </div>
      <div className="table-head" style={{ "--columns": headers.length } as React.CSSProperties}>{headers.map((header, index) => <span className={index === headers.length - 1 ? "numeric-heading" : undefined} key={header}>{header}</span>)}<span className="actions-heading">操作</span></div>
      <div className="editable-rows">{children}</div>
      <button className="add-row" type="button" onClick={onAdd}>＋ 項目を追加</button>
    </section>
  );
}

type RowControlProps = {
  index: number;
  count: number;
  onMove: (direction: RowMoveDirection) => void;
  onToggleLock: () => void;
  onDelete: () => void;
};

function BudgetRow({ item, onChange, ...controls }: { item: BudgetItem; onChange: (item: BudgetItem) => void } & RowControlProps) {
  return <div className={`editable-row cols-2 budget-row${item.locked ? " is-locked" : ""}`}><input aria-label="家計項目名" value={item.name} disabled={item.locked} onChange={(event) => onChange({ ...item, name: event.target.value })} /><MoneyCell label={`${item.name}の予算`} value={item.budget} disabled={item.locked} onChange={(budget) => onChange({ ...item, budget })} /><RowActions locked={item.locked} {...controls} /></div>;
}

function PaymentRow({ item, onChange, ...controls }: { item: PaymentItem; onChange: (item: PaymentItem) => void } & RowControlProps) {
  return <div className={`editable-row cols-2${item.locked ? " is-locked" : ""}`}><input aria-label="請求・引落先名" value={item.name} disabled={item.locked} onChange={(event) => onChange({ ...item, name: event.target.value })} /><MoneyCell label={`${item.name}の確定請求・引落額`} value={item.actual} disabled={item.locked} onChange={(actual) => onChange({ ...item, actual })} /><RowActions locked={item.locked} {...controls} /></div>;
}

function TemplatePaymentRow({ item, onChange, ...controls }: { item: PaymentItem; onChange: (item: PaymentItem) => void } & RowControlProps) {
  return <div className={`editable-row billing-template-row${item.locked ? " is-locked" : ""}`}><input aria-label="請求・引落先名" value={item.name} disabled={item.locked} onChange={(event) => onChange({ ...item, name: event.target.value })} /><RowActions locked={item.locked} {...controls} /></div>;
}

type AllocationSourceOption = {
  id: string;
  label: string;
  amount?: number;
};

function DestinationRow({ destination, sources, onChange, onSourceIdsChange, ...controls }: { destination: AllocationDestination; sources: AllocationSourceOption[]; onChange: (destination: AllocationDestination) => void; onSourceIdsChange: (sourceIds: string[]) => void } & RowControlProps) {
  return <div className={`editable-row destination-row allocation-row${destination.locked ? " is-locked" : ""}`}><input aria-label="振り分け先口座" value={destination.name} disabled={destination.locked} onChange={(event) => onChange({ ...destination, name: event.target.value })} /><AllocationGroupPicker label={`${destination.name}の集計グループ`} sourceIds={destination.sourceIds ?? []} sources={sources} disabled={destination.locked} onChange={onSourceIdsChange} /><RowActions locked={destination.locked} {...controls} /></div>;
}

function AllocationRow({ item, sources, onChange, onSourceIdsChange, ...controls }: { item: AllocationItem; sources: AllocationSourceOption[]; onChange: (item: AllocationItem) => void; onSourceIdsChange: (sourceIds: string[]) => void } & RowControlProps) {
  return <div className={`editable-row cols-3 allocation-row${item.locked ? " is-locked" : ""}`}><input aria-label="振り分け先" value={item.name} disabled={item.locked} onChange={(event) => onChange({ ...item, name: event.target.value })} /><AllocationGroupPicker label={`${item.name}の集計グループ`} sourceIds={item.sourceIds ?? []} sources={sources} disabled={item.locked} onChange={onSourceIdsChange} /><ReadOnlyMoney label={`${item.name}への自動振り分け額`} value={item.amount} /><RowActions locked={item.locked} {...controls} /></div>;
}

function AllocationGroupPicker({ label, sourceIds, sources, disabled = false, onChange }: { label: string; sourceIds: string[]; sources: AllocationSourceOption[]; disabled?: boolean; onChange: (sourceIds: string[]) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      const details = detailsRef.current;
      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
        detailsRef.current.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const summary = sourceIds.length > 0 ? `${sourceIds.length}件選択` : "未指定（0円）";
  if (disabled) {
    const selectedSources = sourceIds.map(
      (sourceId) => sources.find((source) => source.id === sourceId) ?? {
        id: sourceId,
        label: "削除済みの項目",
      },
    );
    const selectedLabels = selectedSources.map((source) => source.label).join("、");

    return (
      <span
        className="allocation-group-picker is-disabled"
        tabIndex={0}
        aria-label={`${label}（ロック中${selectedLabels ? `、選択中: ${selectedLabels}` : "、未指定"}）`}
      >
        {summary}
        {selectedSources.length > 0 && (
          <span className="locked-selection-tooltip" role="tooltip">
            <strong>選択中の項目</strong>
            {selectedSources.map((source) => (
              <span key={source.id}>
                <span>{source.label}</span>
                {source.amount !== undefined && <small>{yen.format(source.amount)}</small>}
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  return (
    <details ref={detailsRef} className="allocation-group-picker">
      <summary aria-label={label}>{summary}</summary>
      <div className="allocation-group-menu">
        {sources.map((source) => (
          <label key={source.id}>
            <input
              type="checkbox"
              checked={sourceIds.includes(source.id)}
              onChange={(event) => onChange(
                event.target.checked
                  ? Array.from(new Set([...sourceIds, source.id]))
                  : sourceIds.filter((sourceId) => sourceId !== source.id),
              )}
            />
            <span>{source.label}</span>
            {source.amount !== undefined && <small>{yen.format(source.amount)}</small>}
          </label>
        ))}
      </div>
    </details>
  );
}

function MoneyCell({ label, value, disabled = false, onChange }: { label: string; value: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <span className="row-money"><MoneyNumberInput label={label} value={value} currency disabled={disabled} onChange={onChange} /></span>;
}

function ReadOnlyMoney({ label, value }: { label: string; value: number }) {
  return <output className="row-money read-only-money" aria-label={label}>{formatMoneyText(value, true)}</output>;
}

function MoneyNumberInput({ label, value, currency = false, disabled = false, onChange }: { label: string; value: number; currency?: boolean; disabled?: boolean; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(formatMoneyText(value, currency));
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setDraft(formatMoneyText(value, currency));
  }, [currency, value]);

  return (
    <input
      aria-label={label}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      value={draft}
      onFocus={() => {
        editing.current = true;
        setDraft(String(value));
      }}
      onChange={(event) => {
        const normalized = normalizeMoneyText(event.target.value);
        setDraft(normalized);
        onChange(moneyFromText(normalized));
      }}
      onBlur={() => {
        editing.current = false;
        const amount = moneyFromText(draft);
        setDraft(formatMoneyText(amount, currency));
        onChange(amount);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

function RowActions({ index, count, locked = false, onMove, onToggleLock, onDelete }: RowControlProps & { locked?: boolean }) {
  return (
    <div className="row-actions">
      <button className="move-row" type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="この項目を上へ移動" title="上へ移動">↑</button>
      <button className="move-row" type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="この項目を下へ移動" title="下へ移動">↓</button>
      <button className={`lock-row${locked ? " active" : ""}`} type="button" onClick={onToggleLock} aria-pressed={locked} aria-label={locked ? "ロックを解除" : "この項目をロック"} title={locked ? "ロックを解除して編集可能にする" : "編集と削除をロックする"}>{locked ? "🔒" : "🔓"}</button>
      <DeleteButton disabled={locked} onClick={onDelete} />
    </div>
  );
}

function DeleteButton({ disabled = false, onClick }: { disabled?: boolean; onClick: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), 3_000);
    return () => window.clearTimeout(timeout);
  }, [armed]);

  return <button className={`delete-row${armed ? " armed" : ""}`} type="button" disabled={disabled} onBlur={() => setArmed(false)} onClick={() => armed ? onClick() : setArmed(true)} aria-label={armed ? "もう一度押して削除を確定" : disabled ? "ロック中のため削除できません" : "この項目を削除"} title={armed ? "もう一度押すと削除します" : "削除"}>×</button>;
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function replaceItem<T extends { id: string }>(items: T[], next: T) {
  return items.map((item) => (item.id === next.id ? next : item));
}

function removeItem<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}

function newBudgetItem(): BudgetItem {
  return { id: crypto.randomUUID(), name: "新しい項目", budget: 0 };
}

function newPaymentItem(): PaymentItem {
  return { id: crypto.randomUUID(), name: "新しい請求・引落先", actual: 0 };
}

function newAllocationItem(): AllocationItem {
  return { id: crypto.randomUUID(), name: "新しい振り分け先", amount: 0, sourceIds: [] };
}

function newAllocationDestination(): AllocationDestination {
  return { id: crypto.randomUUID(), name: "新しい振り分け先", sourceIds: [] };
}

function createAllocationSources(
  plan: MonthlyPlan,
  summary: ReturnType<typeof calculateMonthlySummary>,
): AllocationSourceOption[] {
  return [
    { id: TAX_RESERVE_SOURCE_ID, label: "税金として確保", amount: summary.taxReserve },
    { id: CONSUMPTION_TAX_SOURCE_ID, label: "消費税納付見込", amount: summary.consumptionTaxReserve },
    ...plan.paymentItems.map((item) => ({
      id: paymentSourceId(item.id),
      label: item.name,
      amount: item.actual,
    })),
  ];
}

function createTemplateAllocationSources(
  paymentItems: PaymentItem[],
): AllocationSourceOption[] {
  return [
    { id: TAX_RESERVE_SOURCE_ID, label: "税金として確保" },
    { id: CONSUMPTION_TAX_SOURCE_ID, label: "消費税納付見込" },
    ...paymentItems.map((item) => ({
      id: paymentSourceId(item.id),
      label: item.name,
    })),
  ];
}
