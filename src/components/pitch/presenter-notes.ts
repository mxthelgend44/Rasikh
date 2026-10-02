/** Presenter notes. Index order matches slides.ts (checked by the deck at build time). */
export type PitchNote = {
  index: number;
  label: string;
  seconds: number;
  say: string[];
  cue?: string;
};

export const PITCH_NOTES: PitchNote[] = [
  {
    index: 0,
    label: 'Rasikh',
    seconds: 8,
    say: [
      'Rasikh means steadfast, rooted.',
      'We help people and companies arrive in Abu Dhabi already settled.',
    ],
  },
  {
    index: 1,
    label: 'The move',
    seconds: 14,
    say: [
      'Priya accepts a job here. Watch the first thirty days.',
      'Documents asked for twice, a landlord asking for salary slips, a bank waiting on a tenancy.',
    ],
    cue: 'A composite scenario, not a customer case.',
  },
  {
    index: 2,
    label: 'The first 30 days',
    seconds: 14,
    say: [
      'Each step unlocks the next: visa, Emirates ID, tenancy, bank, school.',
      'And each step asks for documents again.',
    ],
    cue: 'Requirements vary; this is a typical order.',
  },
  {
    index: 3,
    label: 'The coordination gap',
    seconds: 16,
    say: [
      'Six parties, no shared plan.',
      'The newcomer forwards full documents to everyone because nobody can share just the part that matters.',
    ],
  },
  {
    index: 4,
    label: 'The problem',
    seconds: 16,
    say: [
      'The services depend on each other, and the passport alone is handed over three times.',
      'That is the problem: order and disclosure.',
    ],
    cue: 'From our catalogue; requirements are illustrative.',
  },
  {
    index: 5,
    label: 'Introducing Rasikh',
    seconds: 8,
    say: ['One plan for the whole move, with a privacy guard on every step.'],
  },
  {
    index: 6,
    label: 'The proposed solution',
    seconds: 16,
    say: ['Plan the move, guard the data, prepare the services, back the hire.'],
  },
  {
    index: 7,
    label: 'How the system works',
    seconds: 20,
    say: [
      'The agent drafts each step. Nothing leaves without passing Rasikh Guard.',
      'Guard uses OpenAPPA’s label algebra and returns the smallest verified fix when it refuses.',
    ],
  },
  {
    index: 8,
    label: 'The Guard moment',
    seconds: 20,
    say: [
      'A rental application goes to a landlord.',
      'The salary slip is stopped; the yes or no affordability result goes instead.',
    ],
    cue: 'The captions match the real Guard response for this request.',
  },
  {
    index: 9,
    label: 'The trust passport',
    seconds: 16,
    say: [
      'Each switch is one label and one destination.',
      'Switch it off and the next send needs consent again.',
    ],
  },
  {
    index: 10,
    label: 'Finding and ordering services',
    seconds: 16,
    say: [
      'Search in English, Arabic or a transliteration, typos included.',
      'Prerequisites come back in the order to do them.',
    ],
    cue: 'Mock catalogue; no live TAMM API.',
  },
  {
    index: 11,
    label: 'Company expansion',
    seconds: 14,
    say: [
      'A company sets up step by step. When the visa quota lands, its first hires start moving.',
    ],
  },
  {
    index: 12,
    label: 'Security evidence',
    seconds: 24,
    say: [
      '681 guard tests pass, including every policy cell and 25 attack paths.',
      'An independent harness ran 25 attacks three times: zero forbidden allows.',
    ],
    cue: 'Numbers measured on main on 2 October 2026; commands are in the brief.',
  },
  {
    index: 13,
    label: 'Why Rasikh',
    seconds: 16,
    say: ['Ordered, minimum disclosure, refusals that help, and the employer relationship.'],
  },
  {
    index: 14,
    label: 'What is built today',
    seconds: 14,
    say: [
      'Guard and the data layer work. TAMM is a prototype over a mock catalogue. UAE PASS and the pilot are planned.',
    ],
  },
  {
    index: 15,
    label: 'Value to demonstrate',
    seconds: 14,
    say: [
      'A pilot measures days to settled, re-sent documents, resolved refusals and HR hours.',
      'We claim no savings before that.',
    ],
  },
  {
    index: 16,
    label: 'First customer',
    seconds: 14,
    say: ['A Hub71 company landing its first team feels the whole chain.'],
    cue: 'No signed pilot is implied.',
  },
  {
    index: 17,
    label: 'Proposed business model',
    seconds: 12,
    say: ['The employer pays, because the employer carries the cost of a slow move.'],
    cue: 'No prices until discovery supports them.',
  },
  {
    index: 18,
    label: 'Development roadmap',
    seconds: 12,
    say: ['Now working components, next a pilot, then real integrations where approvals allow.'],
  },
  {
    index: 19,
    label: 'The next conversation',
    seconds: 12,
    say: [
      'We are looking for one company to co-design the first pilot.',
      'Rasikh. Arrive already settled.',
    ],
    cue: 'Open the research brief from the top navigation.',
  },
];
