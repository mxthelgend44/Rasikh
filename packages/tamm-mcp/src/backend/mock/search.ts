/**
 * Service search for the mock catalogue: BM25 over weighted fields, with query expansion.
 *
 * - Fields: keywords (weight 3), name and tags (2), entity (1). A field's weight repeats its
 *   tokens in the document, the usual BM25F approximation.
 * - Synonyms (`search_synonyms` in the catalogue) map a phrase, in English, Arabic or a common
 *   transliteration, to extra terms. "iqama" and "إقامة" both expand to "residence residency".
 * - Typo tolerance: a query word of five or more letters that is not in the vocabulary matches
 *   vocabulary words within edit distance 1, at a reduced weight.
 */
import { editDistance, tokenize } from "./text.js";

const K1 = 1.2;
const B = 0.75;
const FUZZY_MIN_LENGTH = 5;
const FUZZY_WEIGHT = 0.7;
const SYNONYM_WEIGHT = 0.8;

export interface SearchDocument {
  id: string;
  keywords: readonly string[];
  name: string;
  tags: readonly string[];
  entity: string;
}

/** A synonym phrase and the terms it adds to a query. */
export interface Synonym {
  phrase: string;
  expands_to: string;
}

export interface SearchHit {
  id: string;
  score: number;
}

interface IndexedDocument {
  id: string;
  termCounts: Map<string, number>;
  length: number;
}

/** Weighted query terms: each term once, with the strongest weight it was reached by. */
type Query = Map<string, number>;

export class SearchIndex {
  private readonly documents: IndexedDocument[];
  private readonly documentFrequency = new Map<string, number>();
  private readonly averageLength: number;
  private readonly synonyms: { phrase: string[]; terms: string[] }[];

  constructor(documents: readonly SearchDocument[], synonyms: readonly Synonym[]) {
    this.documents = documents.map((document) => {
      const tokens = [
        ...repeat(tokenize(document.keywords.join(" ")), 3),
        ...repeat(tokenize(`${document.name} ${document.tags.join(" ").replaceAll("_", " ")}`), 2),
        ...tokenize(document.entity),
      ];
      const termCounts = new Map<string, number>();
      for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
      }
      for (const term of termCounts.keys()) {
        this.documentFrequency.set(term, (this.documentFrequency.get(term) ?? 0) + 1);
      }
      return { id: document.id, termCounts, length: tokens.length };
    });
    this.averageLength = this.documents.reduce((sum, d) => sum + d.length, 0) / Math.max(this.documents.length, 1);
    this.synonyms = synonyms.map((synonym) => ({
      phrase: tokenize(synonym.phrase),
      terms: tokenize(synonym.expands_to),
    }));
  }

  /** Documents matching `text`, best first, with BM25 scores rounded to two decimals. */
  search(text: string, ids?: ReadonlySet<string>): SearchHit[] {
    const query = this.expand(tokenize(text));
    return this.documents
      .filter((document) => !ids || ids.has(document.id))
      .map((document) => ({ id: document.id, score: Math.round(this.score(document, query) * 100) / 100 }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }

  private expand(tokens: readonly string[]): Query {
    const query: Query = new Map();
    const add = (term: string, weight: number) => query.set(term, Math.max(query.get(term) ?? 0, weight));
    for (const token of tokens) {
      add(token, 1);
    }
    for (const synonym of this.synonyms) {
      if (containsPhrase(tokens, synonym.phrase)) {
        synonym.terms.forEach((term) => add(term, SYNONYM_WEIGHT));
      }
    }
    for (const [term, weight] of [...query]) {
      if (term.length >= FUZZY_MIN_LENGTH && !this.documentFrequency.has(term)) {
        for (const known of this.documentFrequency.keys()) {
          if (editDistance(term, known, 1) <= 1) {
            add(known, weight * FUZZY_WEIGHT);
          }
        }
      }
    }
    return query;
  }

  private score(document: IndexedDocument, query: Query): number {
    let score = 0;
    for (const [term, weight] of query) {
      const frequency = document.termCounts.get(term);
      if (!frequency) {
        continue;
      }
      const df = this.documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (this.documents.length - df + 0.5) / (df + 0.5));
      const norm = frequency + K1 * (1 - B + (B * document.length) / this.averageLength);
      score += weight * idf * ((frequency * (K1 + 1)) / norm);
    }
    return score;
  }
}

function repeat<T>(items: readonly T[], times: number): T[] {
  return Array.from({ length: times }, () => items).flat();
}

function containsPhrase(tokens: readonly string[], phrase: readonly string[]): boolean {
  if (phrase.length === 0) {
    return false;
  }
  return tokens.some((_, start) => phrase.every((word, offset) => tokens[start + offset] === word));
}
