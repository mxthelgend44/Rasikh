/**
 * Styles the guide cannot express as utility classes: the spotlight ring (a fixed element with one
 * very large box-shadow as the dimmer) and the motion. Every animation lives inside
 * prefers-reduced-motion: no-preference.
 */
export const TOUR_CSS = `
.rasikh-tour-ring {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: 35;
  width: 0;
  height: 0;
  border-radius: 0.5rem;
  opacity: 0;
  pointer-events: none;
  --tour-dim: rgb(var(--brand-ink) / 0.42);
  box-shadow:
    0 0 0 2px rgb(var(--surface)),
    0 0 0 4px rgb(var(--accent)),
    0 0 0 9999px var(--tour-dim);
}
.dark .rasikh-tour-ring {
  --tour-dim: rgb(10 24 29 / 0.58);
}
@media (prefers-reduced-motion: no-preference) {
  @keyframes rasikh-tour-in {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes rasikh-tour-step {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes rasikh-tour-launcher {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }
  .rasikh-tour-panel { animation: rasikh-tour-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
  .rasikh-tour-step { animation: rasikh-tour-step 240ms ease-out both; }
  .rasikh-tour-launcher { animation: rasikh-tour-launcher 200ms ease-out both; }
  .rasikh-tour-progress > span { transition: background-color 200ms ease-out; }
}
@media print {
  .rasikh-tour-ring, .rasikh-tour-panel, .rasikh-tour-launcher { display: none !important; }
}
`;
