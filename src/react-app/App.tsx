import { useEffect, useState } from "react";
import { Dashboard } from "../../app/Dashboard";
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
    <main className="landing-shell">
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-mark">皮</span>
          <span>皮算用</span>
        </div>
        <a className="nav-button" href={signInHref}>ログイン</a>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">フリーランスの月次資金管理</p>
          <h1>毎月のお金を、<br />ひとつの台帳で。</h1>
          <p>報酬、税金、請求額、家計予算、口座への振り分け。毎月の確認と記録を、迷わない順番にまとめます。</p>
          <a className="primary-button landing-cta" href={signInHref}>
            ChatGPTでログイン <span>→</span>
          </a>
          <small>新しいパスワードは不要です。記録はログインした本人だけに表示されます。</small>
        </div>
        <div className="landing-visual" aria-label="皮算用でできること">
          <div className="visual-ticket ticket-income"><span>今月の報酬</span><strong>¥ 900,000</strong><i>入力</i></div>
          <div className="flow-line"><span>自動計算</span></div>
          <div className="visual-results">
            <div><span>税金確保</span><strong>30%</strong></div>
            <div><span>家計予算</span><strong>18項目</strong></div>
            <div><span>振り分け</span><strong>7口座</strong></div>
          </div>
        </div>
      </section>
      <section className="feature-grid">
        <article><span>01</span><h2>報酬を記録</h2><p>毎月の振込額を入力。2026年のExcelデータも移行済みです。</p></article>
        <article><span>02</span><h2>税金を確保</h2><p>設定した割合を千円単位で切り上げ、使わないお金を明確にします。</p></article>
        <article><span>03</span><h2>家計へ振り分け</h2><p>生活費・積立・口座移動を一覧にして、残せる金額をその場で確認。</p></article>
      </section>
    </main>
  );
}
