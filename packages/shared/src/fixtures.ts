/** Demo fixture ids. INTEGRATION.md section 5. The app, Guard and TAMM MCP all seed these. */

export const DEMO_FIXTURES = {
  /** International hire, path 1. */
  hire: 'hire_demo_001',
  /** Foreign company opening an Abu Dhabi branch, path 2. */
  company: 'company_demo_001',
  /** First three transferred employees in path 2. */
  transferredHires: ['hire_demo_002', 'hire_demo_003', 'hire_demo_004'],
  /** Apartment on Al Reem Island used in the rental moment. */
  lease: 'lease_reem_2207',
  /** Passport document for the main hire. */
  passportDoc: 'doc_passport_hire_demo_001',
} as const;
