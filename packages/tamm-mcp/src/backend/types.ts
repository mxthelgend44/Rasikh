/**
 * The single seam between MCP tools and whatever serves TAMM data.
 *
 * Tools only ever talk to a `TammBackend`. Today that is `MockTammBackend`; a real
 * integration would add another implementation without touching tool code.
 * Shapes follow INTEGRATION.md section 4.4.
 */
import type { ApplicationStatus, Audience, DataLabel, PayloadRef } from "../contract.js";

/** Catalogue id of the Tawtheeq tenancy registration service. */
export const TAWTHEEQ_SERVICE_ID = "svc_tawtheeq_register";

/** A number that is not an official figure: shown for demo realism only. */
export interface IllustrativeNumber {
  value: number;
  illustrative: true;
}

export interface ServiceSummary {
  service_id: string;
  name: string;
  entity: string;
  audience: Audience;
  tags: string[];
}

/** A search result: the summary plus its relevance (higher is better). */
export interface ServiceMatch extends ServiceSummary {
  score: number;
}

export interface RequiredDocument {
  label: DataLabel;
  description: string;
  illustrative: true;
}

export interface ServiceRequirements {
  service_id: string;
  required_documents: RequiredDocument[];
  depends_on: string[];
  est_fee_aed: IllustrativeNumber;
  est_duration_days: IllustrativeNumber;
}

export interface NeedsInfo {
  message: string;
  required_labels: DataLabel[];
}

export interface StatusEvent {
  status: ApplicationStatus;
  at: string;
}

export interface Application {
  application_id: string;
  service_id: string;
  status: ApplicationStatus;
  history: StatusEvent[];
  needs_info: NeedsInfo | null;
}

export interface TradeNameCheck {
  name: string;
  available: boolean;
  notes: string;
}

export interface ApplicationRequest {
  service_id: string;
  applicant_ref: string;
  /** UAE PASS subject that submitted the application. */
  submitted_by: string;
  documents: PayloadRef[];
}

export interface TenancyRequest {
  lease_ref: string;
  applicant_ref: string;
  submitted_by: string;
  documents: PayloadRef[];
}

export interface TammBackend {
  /** Services matching a free-text query for one audience, best match first. */
  searchServices(query: string, audience: Audience): Promise<ServiceMatch[]>;
  /** One service by id, or `undefined` if it is not in the catalogue. */
  getService(serviceId: string): Promise<ServiceSummary | undefined>;
  /** Required documents, dependencies, fee and duration, or `undefined` if the service is unknown. */
  getServiceRequirements(serviceId: string): Promise<ServiceRequirements | undefined>;
  /** Submits an application. The caller has already authenticated and Guard-checked it. */
  startApplication(request: ApplicationRequest): Promise<Application>;
  /**
   * Current state of an application, or `undefined` if the id is unknown or `subjectRef` is
   * neither its submitter nor its applicant (unknown and not-yours look the same).
   */
  getApplication(applicationId: string, subjectRef: string): Promise<Application | undefined>;
  /** Availability check for a proposed trade name. */
  checkTradeName(name: string): Promise<TradeNameCheck>;
  /** Registers a tenancy contract through Tawtheeq. The caller has already Guard-checked it. */
  registerTenancy(request: TenancyRequest): Promise<Application>;
}
