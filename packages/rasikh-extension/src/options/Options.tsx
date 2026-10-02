// src/options/Options.tsx
// Per-site grants and language. A grant is for one origin at a time and can be revoked here.
import { useEffect, useState } from "react";
import { t, dirOf, LANGS, type Lang, type Key } from "../panel/i18n";
import { grantSite, revokeSite } from "../background/sites";

const PRACTICE = [
  { label: "localhost:8793", origin: "http://localhost:8793/*" },
  { label: "127.0.0.1:8793", origin: "http://127.0.0.1:8793/*" }
];

export function Options() {
  const [granted, setGranted] = useState<string[]>([]);
  const [lang, setLang] = useState<Lang>("en");
  const tr = (k: Key) => t(lang, k);

  const refresh = () => chrome.permissions.getAll((p) => setGranted((p.origins ?? []).filter((o) => !/:8796\//.test(o))));

  useEffect(() => {
    refresh();
    chrome.storage.local.get("lang").then((s) => s.lang && setLang(s.lang as Lang)).catch(() => {});
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }, [lang]);

  const allow = async (origin: string) => {
    await grantSite(origin); // inside the click: a user gesture
    refresh();
  };
  const revoke = async (origin: string) => {
    await revokeSite(origin);
    refresh();
  };

  return (
    <div className="app settings">
      <h1>{tr("settings.title")}</h1>

      <section className="card">
        <h2>{tr("settings.sites")}</h2>
        <p className="muted">{tr("settings.sitesHint")}</p>
        <h2>{tr("settings.granted")}</h2>
        {granted.length === 0 ? (
          <p>{tr("settings.noneGranted")}</p>
        ) : (
          <ul>
            {granted.map((o) => (
              <li key={o}>
                <span dir="ltr">{o}</span>
                <button className="btn btn-quiet" onClick={() => revoke(o)}>
                  {tr("settings.revoke")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>{tr("settings.practice")}</h2>
        <ul>
          {PRACTICE.map((s) => (
            <li key={s.origin}>
              <span dir="ltr">{s.label}</span>
              {granted.includes(s.origin) ? (
                <span className="muted">{tr("settings.allowed")}</span>
              ) : (
                <button className="btn" onClick={() => allow(s.origin)}>
                  {tr("settings.allow")}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{tr("settings.preferences")}</h2>
        <label>
          {tr("settings.language")}{" "}
          <select
            value={lang}
            onChange={(e) => {
              const v = e.target.value as Lang;
              setLang(v);
              chrome.storage.local.set({ lang: v }).catch(() => {});
            }}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l === "en" ? "English" : "العربية"}
              </option>
            ))}
          </select>
        </label>
      </section>
    </div>
  );
}
