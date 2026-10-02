/**
 * Loads and validates the mock TAMM catalogue (`data/catalogue.json`).
 *
 * The catalogue is MOCK data. Fees, durations, documents and review scripts are
 * illustrative, and the schema forces every number and document to carry `illustrative: true`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { applicationStatusSchema, audienceSchema, dataLabelSchema } from "../../contract.js";
import { validateScript } from "./stateMachine.js";

const illustrativeNumber = z.object({ value: z.number().nonnegative(), illustrative: z.literal(true) });

const serviceSchema = z.object({
  service_id: z.string().regex(/^svc_[a-z0-9_]+$/),
  name: z.string().min(1),
  entity: z.string().min(1),
  audience: audienceSchema,
  tags: z.array(z.string()),
  keywords: z.array(z.string()),
  application_prefix: z.string().regex(/^[a-z0-9]+$/),
  depends_on: z.array(z.string()),
  required_documents: z.array(
    z.object({ label: dataLabelSchema, description: z.string().min(1), illustrative: z.literal(true) }),
  ),
  est_fee_aed: illustrativeNumber,
  est_duration_days: illustrativeNumber,
  review_script: z
    .array(
      z.object({
        status: applicationStatusSchema,
        needs_info: z.object({ message: z.string().min(1), required_labels: z.array(dataLabelSchema) }).optional(),
      }),
    )
    .min(1),
});

const catalogueSchema = z
  .object({
    _about: z.string(),
    services: z.array(serviceSchema).min(1),
    taken_trade_names: z.array(z.string()),
    restricted_trade_name_terms: z.array(z.string()),
    search_synonyms: z.array(z.object({ phrase: z.string().min(1), expands_to: z.string().min(1) })),
  })
  .superRefine((catalogue, ctx) => {
    const ids = new Set(catalogue.services.map((service) => service.service_id));
    if (ids.size !== catalogue.services.length) {
      ctx.addIssue({ code: "custom", message: "service_id values must be unique" });
    }
    for (const service of catalogue.services) {
      const problem = validateScript(service.review_script);
      if (problem) {
        ctx.addIssue({ code: "custom", message: `${service.service_id} review_script: ${problem}` });
      }
      for (const dependency of service.depends_on.filter((id) => !ids.has(id))) {
        ctx.addIssue({ code: "custom", message: `${service.service_id} depends on unknown ${dependency}` });
      }
    }
    const cycle = findCycle(catalogue.services);
    if (cycle) {
      ctx.addIssue({ code: "custom", message: `prerequisite cycle: ${cycle.join(" -> ")}` });
    }
  });

/** The first `depends_on` cycle found by depth-first search, or `undefined`. */
function findCycle(services: readonly { service_id: string; depends_on: readonly string[] }[]): string[] | undefined {
  const edges = new Map(services.map((service) => [service.service_id, service.depends_on]));
  const done = new Set<string>();
  const visit = (id: string, path: string[]): string[] | undefined => {
    if (path.includes(id)) {
      return [...path.slice(path.indexOf(id)), id];
    }
    if (done.has(id)) {
      return undefined;
    }
    for (const next of edges.get(id) ?? []) {
      const cycle = visit(next, [...path, id]);
      if (cycle) {
        return cycle;
      }
    }
    done.add(id);
    return undefined;
  };
  for (const id of edges.keys()) {
    const cycle = visit(id, []);
    if (cycle) {
      return cycle;
    }
  }
  return undefined;
}

export type CatalogueService = z.infer<typeof serviceSchema>;
export type Catalogue = z.infer<typeof catalogueSchema>;

const DEFAULT_CATALOGUE_PATH = fileURLToPath(new URL("../../../data/catalogue.json", import.meta.url));

/** Parses and validates a catalogue object, throwing with every problem found. */
export function parseCatalogue(raw: unknown): Catalogue {
  return catalogueSchema.parse(raw);
}

/** Reads the catalogue from disk (defaults to the bundled `data/catalogue.json`). */
export function loadCatalogue(path: string = DEFAULT_CATALOGUE_PATH): Catalogue {
  return parseCatalogue(JSON.parse(readFileSync(path, "utf8")));
}
