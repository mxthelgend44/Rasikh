/**
 * SIMULATED UAE PASS. No real identity provider is involved: a dev endpoint hands out
 * opaque session tokens so the demo flow has an authentication step in the right place.
 */
import { randomBytes } from "node:crypto";
import type { Audience } from "./contract.js";

export interface UaePassSession {
  uaepass_session: string;
  subject_ref: string;
  audience: Audience;
  simulated: true;
}

export class SimulatedUaePass {
  private readonly sessions = new Map<string, UaePassSession>();

  /** Simulates a successful UAE PASS login and returns the new session. */
  login(subjectRef: string, audience: Audience): UaePassSession {
    const session: UaePassSession = {
      uaepass_session: `uap_sim_${randomBytes(4).toString("hex")}`,
      subject_ref: subjectRef,
      audience,
      simulated: true,
    };
    this.sessions.set(session.uaepass_session, session);
    return session;
  }

  /** Looks up a session token; `undefined` means the caller is not authenticated. */
  resolve(token: string): UaePassSession | undefined {
    return this.sessions.get(token);
  }
}
