import { useEffect, useState } from "react";
import { Dashboard } from "../../app/Dashboard";
import { Brand } from "../../app/Brand";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  type ChatGPTUser,
} from "../../app/chatgpt-auth";

type SessionState =
  | { status: "loading" }
  | { status: "ready"; user: ChatGPTUser | null }
  | { status: "error" };

export default function App() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const claimToken = new URLSearchParams(window.location.search).get("claim") ?? "";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("session unavailable");
        return (await response.json()) as { user: ChatGPTUser | null };
      })
      .then(({ user }) => setSession({ status: "ready", user }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({ status: "error" });
      });
    return () => controller.abort();
  }, []);

  if (session.status === "loading") {
    return <main className="session-loading" aria-label="ログイン状態を確認中" />;
  }

  if (session.status === "error") {
    return (
      <main className="session-loading">
        <p>読み込みに失敗しました。ページを再読み込みしてください。</p>
      </main>
    );
  }

  if (!session.user) return <Landing claimToken={claimToken} />;

  return (
    <Dashboard
      displayName={session.user.displayName}
      email={session.user.email}
      signOutHref={chatGPTSignOutPath("/")}
      claimToken={claimToken}
    />
  );
}

function Landing({ claimToken }: { claimToken: string }) {
  const returnTo = claimToken ? `/?claim=${encodeURIComponent(claimToken)}` : "/";
  const signInHref = chatGPTSignInPath(returnTo);

  return (
    <main className="landing-shell" data-ui-version="commercial-2026-07">
      <header className="landing-nav">
        <Brand />
        <a className="nav-button" href={signInHref}>ログイン <span aria-hidden="true">↗</span></a>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow"><span aria-hidden="true" /> フリーランスの月次資金管理</p>
          <h1>稼いだあとを、<br />迷わない。</h1>
          <p>報酬から税金を確保し、請求を整理して、必要な口座へ振り分ける。毎月のお金の流れを、ひとつの静かなワークスペースにまとめます。</p>
          <a className="primary-button landing-cta" href={signInHref}>
            ChatGPTでログイン <span aria-hidden="true">→</span>
          </a>
          <small><span aria-hidden="true">●</span> 新しいパスワードは不要です。記録はログインした本人だけに表示されます。</small>
        </div>
        <div className="landing-visual" aria-label="皮算用の月次資金画面のイメージ">
          <div className="visual-window">
            <div className="visual-window-bar">
              <span className="visual-mini-brand">皮</span>
              <span>7月の資金計画</span>
              <i>保存済み</i>
            </div>
            <div className="visual-ticket ticket-income">
              <span>振込報酬（税込）</span>
              <strong>¥ 1,129,021</strong>
              <i>今月</i>
            </div>
            <div className="visual-results">
              <div><span>税金として確保</span><strong>¥ 339,000</strong></div>
              <div><span>使用可能額</span><strong>¥ 790,021</strong></div>
              <div><span>家計後の余裕</span><strong>¥ 243,265</strong></div>
            </div>
            <div className="visual-allocation">
              <div><span>みずほ（王子）</span><i>5件を集計</i><strong>¥ 508,781</strong></div>
              <div><span>ソニー銀行</span><i>1件を集計</i><strong>¥ 60,000</strong></div>
              <div><span>インデックス投資</span><i>1件を集計</i><strong>¥ 50,000</strong></div>
            </div>
          </div>
        </div>
      </section>
      <section className="feature-grid">
        <article><span>01</span><h2>請求から始める</h2><p>毎月触る確定請求を上から確認。固定行はロックしたまま並べ替えられます。</p></article>
        <article><span>02</span><h2>計算は自動で</h2><p>税金確保・簡易課税・家計予算を一貫したルールで計算し、余裕額まで可視化します。</p></article>
        <article><span>03</span><h2>口座までつなぐ</h2><p>請求項目を複数選び、振り分け先ごとの最終入金額を自動で合算します。</p></article>
      </section>
      <footer className="landing-footer">
        <Brand href="#" />
        <p>Monthly money planning for independent work.</p>
        <a href={signInHref}>ワークスペースを開く <span aria-hidden="true">→</span></a>
      </footer>
    </main>
  );
}
