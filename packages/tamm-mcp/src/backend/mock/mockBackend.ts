/**
 * In-memory `TammBackend` over the mock catalogue. No real TAMM system is contacted.
 */
import type { Audience } from "../../contract.js";
import type {
  Application,
  ApplicationRequest,
  LicensingAuthority,
  ServiceRequirements,
  ServiceSummary,
  TammBackend,
  TenancyDetails,
  TradeNameCheck,
} from "../types.js";
import { TAWTHEEQ_SERVICE_ID } from "../types.js";
import { type Catalogue, type CatalogueService, loadCatalogue } from "./catalogue.js";
import { type Progression, type TrackedApplication, advance, submit } from "./stateMachine.js";
import { checkTradeName } from "./tradeName.js";

export interface MockTammBackendOptions {
  catalogue?: Catalogue;
  progression: Progression;
  /** Milliseconds since epoch; injectable so tests control time. */
  now?: () => number;
}

interface OwnedApplication {
  subjectRef: string;
  tracked: TrackedApplication;
}

export class MockTammBackend implements TammBackend {
  private readonly catalogue: Catalogue;
  private readonly progression: Progression;
  private readonly now: () => number;
  private readonly applications = new Map<string, OwnedApplication>();
  private nextApplicationNumber = 1;

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
        service: toSummary(service),
        requirements: service.requirements,
        fee: service.fee,
        processing_time: service.processing_time,
      }
    );
  }

  async startApplication(request: ApplicationRequest): Promise<Application> {
    const service = this.find(request.service_id);
    if (!service) {
      throw new Error(`unknown service ${request.service_id}`);
    }
    const applicationId = `app_${String(this.nextApplicationNumber++).padStart(4, "0")}`;
    const tracked = submit(applicationId, service.service_id, service.review_script, this.now());
    this.applications.set(applicationId, { subjectRef: request.subject_ref, tracked });
    return structuredClone(tracked.application);
  }

  async getApplicationStatus(applicationId: string, subjectRef: string): Promise<Application | undefined> {
    const owned = this.applications.get(applicationId);
    if (!owned || owned.subjectRef !== subjectRef) {
      return undefined;
    }
    advance(owned.tracked, this.progression, this.now());
    return structuredClone(owned.tracked.application);
  }

  async checkTradeName(proposedName: string, _authority: LicensingAuthority): Promise<TradeNameCheck> {
    return checkTradeName(proposedName, {
      takenNames: this.catalogue.taken_trade_names,
      restrictedTerms: this.catalogue.restricted_trade_name_terms,
    });
  }

  /** The mock records the registration as an application; it does not persist the tenancy details. */
  async registerTenancy(request: ApplicationRequest, _details: TenancyDetails): Promise<Application> {
    return this.startApplication({ ...request, service_id: TAWTHEEQ_SERVICE_ID });
  }

  private find(serviceId: string): CatalogueService | undefined {
    return this.catalogue.services.find((service) => service.service_id === serviceId);
  }
}

function toSummary(service: CatalogueService): ServiceSummary {
  const { service_id, name, entity, audience, tags, summary, channel } = service;
  return { service_id, name, entity, audience, tags, summary, channel };
}

/** Crude relevance: keyword and tag hits weigh more than name or summary hits. */
function relevance(service: CatalogueService, terms: readonly string[]): number {
  const keywords = service.keywords.join(" ").toLowerCase();
  const tags = service.tags.join(" ").toLowerCase();
  const text = `${service.name} ${service.summary}`.toLowerCase();
  return terms.reduce(
    (score, term) =>
      score + (keywords.includes(term) ? 3 : 0) + (tags.includes(term) ? 2 : 0) + (text.includes(term) ? 1 : 0),
    0,
  );
}
