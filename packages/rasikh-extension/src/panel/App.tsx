// src/panel/App.tsx
// The side panel. It never sends a click, type or submit: the buttons here only move the guide
// between steps or ask it to point at the control again.
import { useEffect } from "react";
import { useStore } from "./state/store";
import { onPanelMessage } from "./port";
import { sendToWorker } from "../shared/bus";
import { fetchPacks } from "../background/orchestratorClient";
import { originPattern, grantSite, revokeSite } from "../background/sites";
import { t, dirOf, LANGS, type Lang, type Key } from "./i18n";

async function refreshAccess() {
  const s = useStore.getState();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url ?? "";
    const pattern = originPattern(url);
    const granted = pattern ? await chrome.permissions.contains({ origins: [pattern] }) : false;
    s.setAccess(url, granted);
  } catch {
    s.setAccess("", false);
  }
}

export function App() {
  const s = useStore();
  const tr = (k: Key) => t(s.lang, k);

  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.dir = dirOf(s.lang);
  }, [s.lang]);

  useEffect(() => {
    chrome.storage.local.get("lang").then((r) => r.lang && s.setLang(r.lang as Lang)).catch(() => {});
    fetchPacks().then((r) => s.setPacks(r.provider, r.packs)).catch(() => s.setPacksError());
    refreshAccess();
    onPanelMessage((m) => {
      if (m.type === "guideStep") s.setGuide(m.payload);
      if (m.type === "lessonState" && m.payload.state === "idle") s.setActive(false);
      if (m.type === "error") s.setError(m.payload.code);
    });
    sendToWorker("requestState", {}, "panel")
      .then((st: any) => st?.lesson && s.setActive(true, st.lesson.objective))
      .catch(() => {});
    chrome.tabs.onActivated.addListener(refreshAccess);
    chrome.tabs.onUpdated.addListener(refreshAccess);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pattern = originPattern(s.tabUrl);
  const host = (() => {
    try {
      return new URL(s.tabUrl).host;
    } catch {
      return "";
    }
  })();

  const changeLang = (l: Lang) => {
    s.setLang(l);
    chrome.storage.local.set({ lang: l }).catch(() => {});
    if (s.active) sendToWorker("repeatStep", {}, "panel");
  };
  const grant = async () => {
    if (!pattern) return;
    await grantSite(pattern); // runs inside the click (user gesture): request, then register + inject
    refreshAccess();
  };
  const revoke = async () => {
    if (!pattern) return;
    await revokeSite(pattern); // unregister the content script, then drop the permission
    refreshAccess();
  };
  const start = (skill: string, objective: string) => {
    s.setError("");
    s.setActive(true, objective);
    sendToWorker("startLesson", { skill, objective }, "panel");
  };

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <svg className="mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect width="24" height="24" rx="6" fill="#0B6B78" />
            <path d="M6.25 18V11.25a5.75 5.75 0 0 1 11.5 0V18" fill="none" stroke="#F6E7CD" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="14.25" r="1.75" fill="#F6E7CD" />
          </svg>
          <div>
            <h1>{tr("app.title")}</h1>
            <p className="muted">{tr("app.tagline")}</p>
          </div>
        </div>
        <label className="lang">
          <span className="sr">{tr("lang.label")}</span>
          <select value={s.lang} onChange={(e) => changeLang(e.target.value as Lang)} aria-label={tr("lang.label")}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l === "en" ? "English" : "العربية"}
              </option>
            ))}
          </select>
        </label>
      </header>

      <p className={`badge badge-${s.provider}`} role="status">
        <strong>{s.provider === "ai" ? tr("provider.ai") : tr("provider.demo")}</strong>
        <span>{s.provider === "ai" ? tr("provider.aiHint") : tr("provider.demoHint")}</span>
      </p>

      <section className="card" aria-labelledby="access-h">
        <h2 id="access-h">{tr("access.title")}</h2>
        {!pattern ? (
          <p>{tr("access.none")}</p>
        ) : (
          <>
            <p className="host" dir="ltr">
              {host}
            </p>
            <p>{s.granted ? tr("access.on") : tr("access.off")}</p>
            {s.granted ? (
              <button className="btn btn-quiet" onClick={revoke}>
                {tr("access.revoke")}
              </button>
            ) : (
              <button className="btn" onClick={grant}>
                {tr("access.grant")}
              </button>
            )}
          </>
        )}
      </section>

      {s.error && (
        <p className="alert" role="alert">
          {t(s.lang, `error.${s.error}` as Key) === `error.${s.error}` ? s.error : t(s.lang, `error.${s.error}` as Key)}
        </p>
      )}

      {s.active && s.step ? (
        <section className="card step" aria-live="polite">
          <p className="eyebrow">
            {tr("step.of")} {s.step.index + 1} / {s.step.total}
          </p>
          <h2>{s.step.title}</h2>
          <p className="message">{s.message}</p>
          {!s.step.controlFound && <p className="note">{tr("step.notFound")}</p>}
          {s.step.complete && <p className="note ok">{tr("step.complete")}</p>}
          {s.step.index === s.step.total - 1 && <p className="note">{tr("step.done")}</p>}
          <p className="muted">{tr("step.waiting")}</p>
          <div className="row">
            <button className="btn btn-quiet" disabled={s.step.index === 0} onClick={() => sendToWorker("prevStep", {}, "panel")}>
              {tr("step.back")}
            </button>
            <button className="btn btn-quiet" onClick={() => sendToWorker("repeatStep", {}, "panel")}>
              {tr("step.show")}
            </button>
            <button
              className="btn"
              disabled={s.step.index >= s.step.total - 1}
              onClick={() => sendToWorker("nextStep", {}, "panel")}
            >
              {tr("step.next")}
            </button>
          </div>
          <button
            className="btn btn-link"
            onClick={() => {
              sendToWorker("stopGuide", {}, "panel");
              s.setActive(false);
            }}
          >
            {tr("step.stop")}
          </button>
        </section>
      ) : (
        <section className="card" aria-labelledby="launch-h">
          <h2 id="launch-h">{tr("launcher.title")}</h2>
          {s.packsError || s.packs.length === 0 ? (
            <p>{tr("launcher.empty")}</p>
          ) : (
            <ul className="packs">
              {s.packs.map((p) => (
                <li key={p.id}>
                  <p className="pack-name">{s.lang === "ar" && p.nameAr ? p.nameAr : p.name}</p>
                  <p className="muted">{p.status === "mock" ? tr("launcher.mock") : tr("launcher.draft")}</p>
                  {p.tasks.map((task) => (
                    <div className="row between" key={task.id}>
                      <span>
                        {s.lang === "ar" && task.titleAr ? task.titleAr : task.title}
                        <span className="muted">
                          {" "}
                          · {task.steps} {tr("launcher.steps")}
                        </span>
                      </span>
                      <button className="btn" disabled={!s.granted} onClick={() => start(p.id, task.id)}>
                        {tr("launcher.start")}
                      </button>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <footer className="foot">
        <p>{tr("foot.mock")}</p>
        <p>{tr("foot.draft")}</p>
      </footer>
    </div>
  );
}
