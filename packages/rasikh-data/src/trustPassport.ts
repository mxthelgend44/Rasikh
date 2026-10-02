/**
 * Trust passport sync: turn the newcomer's sharing toggles into the minimal set of Guard
 * consent operations (`POST /consent`, `DELETE /consent/{id}`), so Guard's per-session
 * overrides always match what the newcomer chose.
 */
import { type Consent, DATA_LABELS, DESTINATIONS, type DataLabel, type Destination, type TrustPassport } from "./model.js";

/** Cells of the INTEGRATION.md 3.4 matrix whose effect is `consent`: the only grantable pairs. */
export const CONSENTABLE: ReadonlySet<string> = new Set([
  "passport__landlord",
  "passport__bank",
  "emirates_id__landlord",
  "emirates_id__bank",
  "salary__bank",
  "bank_statement__bank",
  "family__landlord",
  "family__school",
  "address__bank",
  "address__school",
]);

export type ConsentOp =
  | { op: "grant"; label: DataLabel; destination: Destination }
  | { op: "revoke"; label: DataLabel; destination: Destination; guard_consent_id: string | null };

export interface SyncPlan {
  ops: ConsentOp[];
  /** Toggles the newcomer switched on that consent cannot unlock (deny or conditional cells). */
  ignored: { label: DataLabel; destination: Destination }[];
}

/** True if a consent is active and not expired at `now`. */
export function inForce(consent: Consent, now: Date): boolean {
  return consent.active && (consent.expires_at === null || consent.expires_at > now);
}

/**
 * Diffs desired shares against the consents in force. Grants what is wanted and missing,
 * revokes what is in force and no longer wanted, and leaves everything else alone. Output
 * order is stable (contract label order, then destination order), so the plan is deterministic.
 */
export function planConsentSync(passport: TrustPassport, consents: readonly Consent[], now: Date): SyncPlan {
  const current = new Map(
    consents.filter((consent) => inForce(consent, now)).map((consent) => [`${consent.label}__${consent.destination}`, consent]),
  );
  const ops: ConsentOp[] = [];
  const ignored: SyncPlan["ignored"] = [];
  for (const label of DATA_LABELS) {
    for (const destination of DESTINATIONS) {
      const key = `${label}__${destination}`;
      const wanted = passport.shares[label]?.[destination] === true;
      const held = current.get(key);
      if (wanted && !CONSENTABLE.has(key)) {
        ignored.push({ label, destination });
      } else if (wanted && !held) {
        ops.push({ op: "grant", label, destination });
      } else if (!wanted && held) {
        ops.push({ op: "revoke", label, destination, guard_consent_id: held.guard_consent_id });
      }
    }
  }
  return { ops, ignored };
}
