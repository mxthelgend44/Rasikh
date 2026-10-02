/**
 * In-memory `TammBackend` over the mock catalogue. No real TAMM system is contacted.
 * Also implements `DemoControls` for the demo-only dev endpoints.
 */
import type { Audience } from "../../contract.js";
import {
  type Application,
  type ApplicationRequest,
  type ServiceMatch,
  type ServiceRequirements,
  type ServiceSummary,
  TAWTHEEQ_SERVICE_ID,
  type TammBackend,
  type TenancyRequest,
  type TradeNameCheck,
} from "../types.js";
import { type Catalogue, type CatalogueService, loadCatalogue } from "./catalogue.js";
import { type Progression, type TrackedApplication, advance, catchUp, submit } from "./stateMachine.js";
import { SearchIndex } from "./search.js";
import { checkTradeName } from "./tradeName.js";

/** Dev-only controls behind `POST /dev/advance` and `POST /dev/reset` (demo mode). */
export interface DemoControls {
  /** Moves an application to its next scripted status; `undefined` if the id is unknown. */
  advance(applicationId: string): Application | undefined;
  /** Forgets every application. */
  reset(): void;
}

/** An application plus the UAE PASS subjects allowed to read it. */
interface OwnedApplication {
  tracked: TrackedApplication;
  parties: ReadonlySet<string>;
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
  private readonly applications = new Map<string, OwnedApplication>();
  private sequence = 0;
  private readonly index: SearchIndex;

  constructor(options: MockTammBackendOptions) {
    this.catalogue = options.catalogue ?? loadCatalogue();
    this.progression = options.progression;
    this.now = options.now ?? Date.now;
    this.index = new SearchIndex(
      this.catalogue.services.map((service) => ({
        id: service.service_id,
        keywords: service.keywords,
        name: service.name,
        tags: service.tags,
        entity: service.entity,
      })),
      this.catalogue.search_synonyms,
    );
  }

  async searchServices(query: string, audience: Audience): Promise<ServiceMatch[]> {
    const inAudience = this.catalogue.services.filter((service) => service.audience === audience);
    if (query.trim() === "") {
      return inAudience.map((service) => ({ ...toSummary(service), score: 0 }));
    }
    const byId = new Map(inAudience.map((service) => [service.service_id, service]));
    return this.index
      .search(query, new Set(byId.keys()))
      .map((hit) => ({ ...toSummary(byId.get(hit.id) as CatalogueService), score: hit.score }));
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
    this.applications.set(applicationId, { tracked, parties: new Set([request.submitted_by, request.applicant_ref]) });
    return structuredClone(tracked.application);
  }

  async getApplication(applicationId: string, subjectRef: string): Promise<Application | undefined> {
    const owned = this.applications.get(applicationId);
    if (!owned || !owned.parties.has(subjectRef)) {
      return undefined;
    }
    catchUp(owned.tracked, this.progression, this.now());
    return structuredClone(owned.tracked.application);
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
      submitted_by: request.submitted_by,
      documents: request.documents,
    });
  }

  advance(applicationId: string): Application | undefined {
    const owned = this.applications.get(applicationId);
    if (!owned) {
      return undefined;
    }
    advance(owned.tracked, this.now());
    return structuredClone(owned.tracked.application);
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
