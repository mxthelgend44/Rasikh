/**
 * Loads and validates the mock TAMM catalogue (`data/catalogue.json`).
 *
 * The catalogue is MOCK data: fees, processing times, requirements and review scripts are
 * illustrative, and the schema forces every such field to carry `illustrative: true`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { applicationStatusSchema, audienceSchema, dataLabelSchema } from "../../contract.js";
import { validateScript } from "./stateMachine.js";

const illustrative = z.literal(true);

const serviceSchema = z.object({
  service_id: z.string().regex(/^svc_[a-z0-9_]+$/),
  name: z.string().min(1),
  entity: z.string().min(1),
  audience: audienceSchema,
  tags: z.array(z.string()),
  keywords: z.array(z.string()),
  summary: z.string().min(1),
  channel: z.enum(["tamm", "entity_portal"]),
  requirements: z.array(
    z.object({
      requirement_id: z.string(),
      description: z.string(),
      labels: z.array(dataLabelSchema),
      mandatory: z.boolean(),
      illustrative,
    }),
  ),
  fee: z.object({ amount_aed: z.number().nonnegative().nullable(), note: z.string(), illustrative }),
  processing_time: z.object({ text: z.string(), illustrative }),
  review_script: z.array(z.object({ status: applicationStatusSchema, note: z.string() })).min(1),
});

const catalogueSchema = z
  .object({
    _about: z.string(),
    services: z.array(serviceSchema).min(1),
    taken_trade_names: z.array(z.string()),
    restricted_trade_name_terms: z.array(z.string()),
  })
  .superRefine((catalogue, ctx) => {
    const seen = new Set<string>();
    for (const service of catalogue.services) {
      if (seen.has(service.service_id)) {
        ctx.addIssue({ code: "custom", message: `duplicate service_id ${service.service_id}` });
      }
      seen.add(service.service_id);
      const problem = validateScript(service.review_script);
      if (problem) {
        ctx.addIssue({ code: "custom", message: `${service.service_id} review_script: ${problem}` });
      }
    }
  });

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
