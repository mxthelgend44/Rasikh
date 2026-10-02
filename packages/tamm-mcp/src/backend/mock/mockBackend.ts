/**
 * In-memory `TammBackend` over the mock catalogue. No real TAMM system is contacted.
 * Also implements `DemoControls` for the demo-only dev endpoints.
 */
import type { Audience } from "../../contract.js";
import {
  type Application,
  type ApplicationRequest,
  type ServiceRequirements,
  type ServiceSummary,
  TAWTHEEQ_SERVICE_ID,
  type TammBackend,
  type TenancyRequest,
  type TradeNameCheck,
} from "../types.js";
import { type Catalogue, type CatalogueService, loadCatalogue } from "./catalogue.js";
import { type Progression, type TrackedApplication, advance, catchUp, submit } from "./stateMachine.js";
import { checkTradeName } from "./tradeName.js";

/** Dev-only controls behind `POST /dev/advance` and `POST /dev/reset` (demo mode). */
export interface DemoControls {
  /** Moves an application to its next scripted status; `undefined` if the id is unknown. */
  advance(applicationId: string): Application | undefined;
  /** Forgets every application. */
  reset(): void;
}

export interface MockTammBackendOptions {
  progression: Progression;
  catalogue?: Catalogue;
  /** Milliseconds since epoch; injectable so tests control time. */
  now?: () => number;
}

export class MockTammBackend implements TammBackend, DemoControls {
  private readonly catalogue: Catalogue;
  private readonly progression: Progression;
  private readonly now: () => number;
  private readonly applications = new Map<string, TrackedApplication>();
  private sequence = 0;

  constructor(options: MockTammBackendOptions) {
    this.catalogue = options.catalogue ?? loadCatalogue();
    this.progression = options.progression;
    this.now = options.now ?? Date.now;
  }

  async searchServices(query: string, audience: Audience): Promise<ServiceSummary[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return this.catalogue.services
      .filter((service) => service.audience === audience)
      .map((service) => ({ service, score: relevance(service, terms) }))
      .filter(({ score }) => terms.length === 0 || score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ service }) => toSummary(service));
  }

  async getService(serviceId: string): Promise<ServiceSummary | undefined> {
    const service = this.find(serviceId);
    return service && toSummary(service);
  }

  async getServiceRequirements(serviceId: string): Promise<ServiceRequirements | undefined> {
    const service = this.find(serviceId);
    return (
      service && {
        service_id: service.service_id,
        required_documents: structuredClone(service.required_documents),
        depends_on: [...service.depends_on],
        est_fee_aed: { ...service.est_fee_aed },
        est_duration_days: { ...service.est_duration_days },
      }
    );
  }

  async startApplication(request: ApplicationRequest): Promise<Application> {
    const service = this.find(request.service_id);
    if (!service) {
      throw new Error(`unknown service ${request.service_id}`);
    }
    this.sequence += 1;
    const applicationId = `app_${service.application_prefix}_${String(this.sequence).padStart(4, "0")}`;
    const tracked = submit(applicationId, service.service_id, service.review_script, this.progression, this.now());
    this.applications.set(applicationId, tracked);
    return structuredClone(tracked.application);
  }

  async getApplication(applicationId: string): Promise<Application | undefined> {
    const tracked = this.applications.get(applicationId);
    if (!tracked) {
      return undefined;
    }
    catchUp(tracked, this.progression, this.now());
    return structuredClone(tracked.application);
  }

  async checkTradeName(name: string): Promise<TradeNameCheck> {
    return checkTradeName(name, {
      takenNames: this.catalogue.taken_trade_names,
      restrictedTerms: this.catalogue.restricted_trade_name_terms,
    });
  }

  /** The mock records the registration as a Tawtheeq application; the lease itself is not stored. */
  async registerTenancy(request: TenancyRequest): Promise<Application> {
    return this.startApplication({
      service_id: TAWTHEEQ_SERVICE_ID,
      applicant_ref: request.applicant_ref,
      documents: request.documents,
    });
  }

  advance(applicationId: string): Application | undefined {
    const tracked = this.applications.get(applicationId);
    if (!tracked) {
      return undefined;
    }
    advance(tracked, this.now());
    return structuredClone(tracked.application);
  }

  reset(): void {
    this.applications.clear();
    this.sequence = 0;
  }

  private find(serviceId: string): CatalogueService | undefined {
    return this.catalogue.services.find((service) => service.service_id === serviceId);
  }
}

function toSummary(service: CatalogueService): ServiceSummary {
  const { service_id, name, entity, audience, tags } = service;
  return { service_id, name, entity, audience, tags: [...tags] };
}

/** Crude relevance: keyword and tag hits weigh more than name hits. */
function relevance(service: CatalogueService, terms: readonly string[]): number {
  const keywords = service.keywords.join(" ").toLowerCase();
  const tags = service.tags.join(" ").toLowerCase();
  const name = service.name.toLowerCase();
  return terms.reduce(
    (score, term) =>
      score + (keywords.includes(term) ? 3 : 0) + (tags.includes(term) ? 2 : 0) + (name.includes(term) ? 1 : 0),
    0,
  );
}
