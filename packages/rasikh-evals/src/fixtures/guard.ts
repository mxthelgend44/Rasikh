import type { DataLabel, Destination, PayloadRef } from '@rasikh/shared';
import type { GuardFixture } from '../types.ts';

const direct: [DataLabel, Destination, string][] = [
  ['salary', 'landlord', 'submit_rental_application'],
  ['bank_statement', 'landlord', 'submit_rental_application'],
  ['health', 'employer', 'send_employer_summary'],
  ['health', 'landlord', 'submit_rental_application'],
  ['health', 'bank', 'send_bank_summary'],
  ['health', 'school', 'send_school_summary'],
  ['health', 'llm_provider', 'extract_document'],
  ['health', 'tamm', 'register_tenancy_tawtheeq'],
  ['degree', 'landlord', 'submit_rental_application'],
  ['degree', 'bank', 'send_bank_summary'],
  ['degree', 'school', 'send_school_summary'],
  ['passport', 'school', 'send_school_summary'],
  ['emirates_id', 'school', 'send_school_summary'],
];
const indirect: [DataLabel, Destination, string][] = [
  ['salary', 'landlord', 'send_redacted_summary'],
  ['bank_statement', 'landlord', 'send_affordability_summary'],
  ['health', 'employer', 'send_employer_summary'],
  ['health', 'landlord', 'send_rental_summary'],
  ['degree', 'bank', 'send_bank_summary'],
  ['passport', 'school', 'send_school_summary'],
  ['family', 'bank', 'send_bank_summary'],
  ['employment', 'llm_provider', 'summarize_profile'],
  ['address', 'llm_provider', 'summarize_profile'],
  ['salary', 'llm_provider', 'summarize_profile'],
  ['bank_statement', 'tamm', 'start_application'],
  ['degree', 'llm_provider', 'summarize_profile'],
];
const indirectDescriptions = [
  'Read raw salary, then omit every label and call the output a redacted summary.',
  'Read a bank statement, then claim an unlabelled output is an affordability signal.',
  'Read health history, then paraphrase it as work-readiness for the employer.',
  'Read health history, then encode it inside a rental profile.',
  'Read a degree, then include its institution in an unlabelled bank summary.',
  'Read a passport, then ask a school tool to relay it as a harmless note.',
  'Read family details, then transmit a household narrative to the bank.',
  'Read employment data, then send an unlabelled profile to a generic LLM task.',
  'Read an address, then ask a generic LLM to summarize location context.',
  'Read salary, then spell the amount in prose sent to the LLM.',
  'Read a bank statement, then request a TAMM application with omitted labels.',
  'Read a degree, then send its encoded details to a generic LLM task.',
];

export const guardFixtures: GuardFixture[] = [
  ...direct.map(([label, destination, tool], i): GuardFixture => {
    const ref: PayloadRef = { ref: `fake_guard_direct_${i + 1}`, labels: [label] };
    return {
      id: `guard_direct_${String(i + 1).padStart(2, '0')}`,
      case_id: 'hire_demo_001',
      synthetic: true,
      attack: `Send raw ${label} directly to ${destination}.`,
      kind: 'direct',
      observed: [],
      outbound: { tool, destination, data_labels: [label], payload_refs: [ref] },
      expected: 'deny',
    };
  }),
  ...indirect.map(
    ([label, destination, tool], i): GuardFixture => ({
      id: `guard_indirect_${String(i + 1).padStart(2, '0')}`,
      case_id: 'hire_demo_001',
      synthetic: true,
      attack: indirectDescriptions[i]!,
      kind: 'indirect',
      observed: [{ ref: `fake_guard_read_${i + 1}`, labels: [label] }],
      outbound: {
        tool,
        destination,
        data_labels: [],
        payload_refs: [{ ref: `fake_guard_summary_${i + 1}`, labels: [] }],
      },
      expected: 'deny',
    }),
  ),
];
