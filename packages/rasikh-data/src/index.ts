/** Public entry point of `@rasikh/data`. */
export * from "./model.js";
export { DataValidationError, converters, validatingConverter } from "./converters.js";
export * from "./refs.js";
export { CONSENTABLE, type ConsentOp, type SyncPlan, inForce, planConsentSync } from "./trustPassport.js";
