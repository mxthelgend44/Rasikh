/**
 * The single seam between MCP tools and whatever serves TAMM data.
 *
 * Tools only ever talk to a `TammBackend`. Today that is `MockTammBackend`; a real
 * integration would add another implementation without touching tool code.
 */
import type { ApplicationStatus, Audience, DataLabel, PayloadRef } from "../contract.js";

/** A value that is not an official fact: shown for demo realism only. */
export interface Illustrative {
  illustrative: true;
}

/** Where the service is actually handled. Free-zone authorities run their own portals. */
export type ServiceChannel = "tamm" | "entity_portal";

export interface ServiceSummary {
  service_id: string;
  name: string;
  entity: string;
  audience: Audience;
  tags: string[];
  summary: string;
  channel: ServiceChannel;
}

export interface Requirement extends Illustrative {
  requirement_id: string;
  description: string;
  labels: DataLabel[];
  mandatory: boolean;
}

export interface Fee extends Illustrative {
  amount_aed: number | null;
  note: string;
}

export interface ProcessingTime extends Illustrative {
  text: string;
}

export interface ServiceRequirements {
  service: ServiceSummary;
  requirements: Requirement[];
  fee: Fee;
  processing_time: ProcessingTime;
}

export interface StatusEvent {
  status: ApplicationStatus;
  at: string;
  note: string;
}

export interface Application {
  application_id: string;
  service_id: string;
  status: ApplicationStatus;
  submitted_at: string;
  history: StatusEvent[];
}

/** Catalogue id of the Tawtheeq tenancy registration service. */
export const TAWTHEEQ_SERVICE_ID = "svc_tawtheeq_registration";

export const LICENSING_AUTHORITIES = ["ded", "adgm", "kezad", "masdar", "twofour54"] as const;
export type LicensingAuthority = (typeof LICENSING_AUTHORITIES)[number];

export type TradeNameIssueCode = "too_short" | "too_long" | "invalid_characters" | "restricted_term" | "name_taken";

export interface TradeNameIssue {
  code: TradeNameIssueCode;
  message: string;
}

export interface TradeNameCheck extends Illustrative {
  proposed_name: string;
  available: boolean;
  issues: TradeNameIssue[];
  suggestions: string[];
}

export interface TenancyDetails {
  property_ref: string;
  landlord_name: string;
  annual_rent_aed: number;
  start_date: string;
  end_date: string;
}

export interface ApplicationRequest {
  service_id: string;
  subject_ref: string;
  payload_refs: PayloadRef[];
}

export interface TammBackend {
  /** Services matching a free-text query for one audience, best match first. */
  searchServices(query: string, audience: Audience): Promise<ServiceSummary[]>;
  /** One service by id, or `undefined` if it does not exist. */
  getService(serviceId: string): Promise<ServiceSummary | undefined>;
  /** Requirements, fee and processing time for a service, or `undefined` if it does not exist. */
  getServiceRequirements(serviceId: string): Promise<ServiceRequirements | undefined>;
  /** Submits an application. The caller has already authorised and Guard-checked it. */
  startApplication(request: ApplicationRequest): Promise<Application>;
  /** Current status of an application owned by `subjectRef`, or `undefined` if not found. */
  getApplicationStatus(applicationId: string, subjectRef: string): Promise<Application | undefined>;
  /** Availability and naming-rule check for a proposed trade name. */
  checkTradeName(proposedName: string, authority: LicensingAuthority): Promise<TradeNameCheck>;
  /** Registers a tenancy contract through Tawtheeq; returns the resulting application. */
  registerTenancy(request: ApplicationRequest, details: TenancyDetails): Promise<Application>;
}
