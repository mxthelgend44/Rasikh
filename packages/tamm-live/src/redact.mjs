/**
 * Redaction for everything that leaves the runner. Two layers:
 * 1. the runner builds steps from whitelisted fields only (labels, refs, ids, decisions, statuses);
 * 2. `sanitize` is the safety net: it hides secret-bearing keys and replaces any known secret value.
 */

export const HIDDEN = "(hidden)";

/** First 6 characters plus an ellipsis, so a Guard session is recognisable but never usable. */
export function maskId(value) {
  const text = String(value ?? "");
  return text.length > 6 ? `${text.slice(0, 6)}…` : text;
}

const HIDE_KEYS = new Set([
  "uaepass_session", "token", "access_token", "id_token", "secret", "authorization", "password",
  "raw", "raw_value", "content", "document_text", "document_content", "file_content",
]);
const MASK_KEYS = new Set(["session_id", "guard_session_id"]);

/** Deep copy with secret keys hidden, session ids masked, and `secrets` replaced inside any string. */
export function sanitize(value, secrets = []) {
  const known = secrets.filter((s) => s && typeof s.value === "string" && s.value.length >= 6);
  const walk = (node, key) => {
    if (typeof key === "string") {
      const lower = key.toLowerCase();
      if (HIDE_KEYS.has(lower)) return HIDDEN;
      if (MASK_KEYS.has(lower)) return typeof node === "string" ? maskId(node) : HIDDEN;
    }
    if (typeof node === "string") {
      let out = node;
      for (const s of known) out = out.split(s.value).join(s.replacement);
      return out;
    }
    if (Array.isArray(node)) return node.map((item) => walk(item));
    if (node && typeof node === "object") {
      const copy = {};
      for (const [k, v] of Object.entries(node)) copy[k] = walk(v, k);
      return copy;
    }
    return node;
  };
  return walk(value);
}
