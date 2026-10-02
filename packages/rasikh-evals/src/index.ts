export { runEvaluations } from './runner.ts';
export { runRepeatedEvaluations, describeVariance } from './repeated.ts';
export type { EvalOptions } from './runner.ts';
export type {
  AiAdapter,
  GuardAdapter,
  GuardOutcome,
  EvalReport,
  DocumentFixture,
  RoadmapFixture,
  RoadmapAnswer,
  SummaryFixture,
  GuardFixture,
  Metric,
  CaseResult,
} from './types.ts';
export { DemoAiAdapter, DemoGuardAdapter } from './adapters/demo.ts';
export { HttpGuardAdapter } from './adapters/guard.ts';
export { AppHttpAdapter } from './adapters/app.ts';
export { OpenAiAdapter } from './adapters/openai.ts';
export { VertexAiAdapter } from './adapters/vertex.ts';
export {
  VertexStructuredModel,
  createStructuredModel,
  vertexSchema,
} from './providers/structured.ts';
export type { StructuredModel, StructuredRequest, VertexOptions } from './providers/structured.ts';
export { scoreExtraction, scoreRoadmap, scoreSummary } from './metrics.ts';
export { renderReport } from './report.ts';
export {
  runInjectionEvaluations,
  HttpInjectionGate,
  renderInjectionReport,
  writeInjectionEvidence,
} from './injection/runner.ts';
export { ReferenceInjectionModel } from './injection/model.ts';
export type { InjectionOptions, InjectionReport } from './injection/types.ts';
export { runDocumentEvaluations, renderDocumentReport } from './documents/runner.ts';
export type { DocumentEvalOptions, DocumentEvalReport } from './documents/runner.ts';
export { StructuredVisionAdapter } from './documents/model.ts';
export { loadDocumentManifest, readVerifiedImage } from './documents/manifest.ts';
