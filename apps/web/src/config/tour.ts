import type { TourStep } from './tour-types';

/**
 * The presenter's story. Order is the order a presenter takes.
 *
 * - `demo` is the three-minute story (seconds sum to about 180).
 * - `features` contains every demo step plus extra stops for questions and a closer look.
 *
 * Every label quoted in `show` exists in the app today. Targets are ids, aria attributes and hrefs
 * that exist in the seeded state; the checker is qa/tour-selectors.mjs. The spoken lines stay in
 * English: they are the presenter's talking points, not product copy.
 *
 * Truthfulness: Guard's decisions passed 75 of 75 synthetic attacks in the latest HTTP measurement
 * (an archived evaluation allowed 12 of 25), but end-to-end safety is NOT measured; document
 * extraction is a labelled demo preview, nothing leaves the app, and money figures are
 * illustrative. Keep the `honesty` lines when editing.
 */
export const TOUR_STEPS: TourStep[] = [
  // The story (demo + features)
  {
    id: 'problem',
    tracks: ['demo', 'features'],
    surface: 'hub',
    href: '/',
    target: '#hub-title',
    title: 'The problem',
    summary:
      'Relocating to Abu Dhabi is a chain of dependent steps, and nobody holds the whole picture.',
    say: [
      'Moving to Abu Dhabi is up to nine steps, and each one depends on another.',
      'The steps sit with different people: an employer, immigration, a landlord, a bank.',
      'Each of them sees their own piece. Nobody sees the whole move, and the newcomer is left chasing.',
    ],
    show: [
      'Start on the hub, with the headline in view.',
      'Say the four parties out loud while you point down the page: employer, immigration, landlord, bank.',
    ],
    features: ['Dependent steps', 'Four parties'],
    seconds: 15,
  },
  {
    id: 'solution',
    tracks: ['demo', 'features'],
    surface: 'hub',
    href: '/',
    target: 'section[aria-labelledby="hub-roles"]',
    title: 'The solution: one agent, one record',
    summary:
      'Everyone works on the same live record, and an agent does the paperwork only with the newcomer’s consent.',
    say: [
      'Rasikh puts the newcomer, the employer, a landlord and a bank on one shared, live record.',
      'An AI agent prepares the paperwork, and it asks before it sends anything.',
      'Every role, and every person, has a link of its own, so each one opens in its own window.',
    ],
    show: [
      'Scroll to Choose who you are.',
      'Point at the Newcomer card, then the Employer, Landlord and Bank cards.',
      'Open Anders Lindqvist, marked Start here, under Open as a person.',
    ],
    features: ['One shared record', 'Agent asks first', 'One link per person'],
    seconds: 15,
    honesty:
      'Landlords, banks and government services are simulated. Nothing leaves the app. The agent’s draft and its activity feed are recorded demo data, and the optional live AI explanation may be unavailable.',
  },
  {
    id: 'roadmap',
    tracks: ['demo', 'features'],
    surface: 'newcomer',
    href: '/newcomer?as=anders',
    target: 'section[aria-labelledby="next-action-title"]',
    title: 'The newcomer roadmap',
    summary: 'One clear next action, honest progress, and every step shows what it waits on.',
    say: [
      'This is Anders, a solutions architect moving from Stockholm. His employer hired him and backs him.',
      'He sees one clear next action: review a request. Two of nine steps are done.',
      'Every step has an owner and a reason. Tenancy registration stays locked until the home and the visa are done.',
    ],
    show: [
      'Point at Your next action: Review a request.',
      'Point at the progress bar, 2 of 9 steps done, and the line Backed by Gulf Meridian Technologies.',
      'Scroll the steps: Emirates ID application is Waiting on the immigration authority; Register your tenancy contract is Locked.',
    ],
    features: ['Next best action', 'Dependencies', 'Employer backing'],
    seconds: 20,
    honesty:
      'Government and landlord activity on the roadmap is simulated. The Emirates ID status is a recorded demo status, not a live submission.',
  },
  {
    id: 'documents',
    tracks: ['demo', 'features'],
    surface: 'newcomer',
    href: '/newcomer/documents?as=anders',
    target: 'section[aria-labelledby$="-required"]',
    title: 'Documents and the review gate',
    summary:
      'The app suggests fields from each document; nothing moves until the person confirms them.',
    say: [
      'Three documents, each Confirmed in demo.',
      'Every suggested field comes with a confidence score, and Anders reviewed each one.',
      'Nothing moves on until a person confirms. That is the human review gate.',
    ],
    show: [
      'Tap Documents on the bottom bar.',
      'Point at 3 of 3 sets of details confirmed.',
      'Open View details on Passport and point at the extracted fields and their Demo confidence.',
    ],
    features: ['Extraction with confidence', 'Human review gate'],
    seconds: 15,
    honesty:
      'This is a labelled demo preview. In demo mode no AI reads the file: the suggested fields come from the hire profile and the confidence scores are illustrative.',
  },
  {
    id: 'agent-card',
    tracks: ['demo', 'features'],
    surface: 'newcomer',
    href: '/newcomer/agent?as=anders',
    target: 'article[aria-labelledby^="approval-title-"]',
    title: 'The agent asks before it acts',
    summary:
      'The approval card names the recipient, the home, the employer backing and exactly what would be shared.',
    say: [
      'The agent drafted a rental application. It cannot send it. It needs Anders to approve.',
      'The card says who receives it, which home, and that the employer backing is attached.',
      'Look at the contents: the employment letter is allowed, the passport needs consent, and the salary is a derived result only.',
      'The landlord gets a yes or no on affordability. Never the salary.',
    ],
    show: [
      'Tap Agent on the bottom bar.',
      'Read the card: Review rental application, Recipient Al Reem Residences, Home Maryah Plaza Residences.',
      'Point at Employer backing on this application, then at Draft contents: Employment letter, Passport, Salary.',
    ],
    features: ['Explicit consent', 'Derived result, not salary', 'Employer backing'],
    seconds: 20,
    honesty:
      'The draft is seeded demo data. Approving records a simulated submission inside Rasikh. No external application is sent, and rent and salary figures are illustrative.',
  },
  {
    id: 'passport-revoke',
    tracks: ['demo', 'features'],
    surface: 'newcomer',
    href: '/newcomer/passport?as=anders',
    target: 'section[aria-labelledby="current-consent"]',
    title: 'Trust passport: consent is his to take back',
    summary:
      'Every kind of data has a consent per recipient category, and the person can revoke it at any time.',
    say: [
      'This is Anders’s trust passport. Each kind of data has a consent for each kind of recipient.',
      'Passport for Landlords is on. Watch what happens when he takes it back.',
    ],
    show: [
      'Tap Trust passport on the bottom bar.',
      'Under Current consent, point at Passport · Landlords.',
      'Tap Revoke.',
      'Point at the notice on this page: live Guard enforcement is unverified.',
    ],
    features: ['Trust passport', 'Revocable consent'],
    seconds: 15,
    honesty:
      'These controls change demo consent only. The page itself says live Guard enforcement is unverified and that its records are illustrative.',
  },
  {
    id: 'blocked-action',
    tracks: ['demo', 'features'],
    surface: 'newcomer',
    href: '/newcomer/agent?as=anders',
    target: 'article[aria-labelledby^="approval-title-"] button[role="switch"]',
    title: 'The blocked action',
    summary:
      'Without consent the agent cannot send his passport, and the button says why. Consent back on, he approves.',
    say: [
      'Back on the agent card. Approve is greyed out, and it tells him why: the required consent is off.',
      'Without his consent the agent cannot send the passport. That is the blocked action.',
      'He turns the Passport switch back on, and now he can approve. Consent is his to give and take back.',
    ],
    show: [
      'Tap Agent. This needs the Revoke from the last step: if Passport · Landlords is still on, revoke it first. Point at Approve demo submission, disabled, with the reason: Turn on the required consent to approve this draft.',
      'Turn the Passport switch back on.',
      'Tap Approve demo submission. The card clears and the feed records it.',
    ],
    features: ['Blocked action', 'Explicit consent', 'Reason shown'],
    seconds: 20,
    honesty:
      'This block is the app’s own consent rule on the newcomer side. It is not a Guard verdict. The Guard page holds its own results: an archived evaluation allowed 12 of 25 forbidden synthetic flows, and a newer measurement of the deployed release denied all 25 in each of 3 runs. That tests the policy decision only, not the agent end to end.',
  },
  {
    id: 'landlord-live',
    tracks: ['demo', 'features'],
    surface: 'landlord',
    href: '/landlord/applications',
    target:
      'tr:has(a[href="/landlord/applications/app_seed_06"]), li:has(a[href="/landlord/applications/app_seed_06"])',
    title: 'The landlord receives it, live',
    summary:
      'The application reaches the landlord’s inbox the moment it is approved, with no refresh.',
    say: [
      'Switch to the landlord window. Do not reload.',
      'Before the approval this row was locked: Awaiting applicant approval, details not released.',
      'The moment Anders approved, it opened here. No email, no chasing.',
    ],
    show: [
      'Switch to the landlord window on Rental applications, organisation Al Reem Residences.',
      'Point at the row for Maryah Plaza Residences, unit 1706. It now names Anders Lindqvist.',
      'Open the row.',
    ],
    features: ['Live sync', 'Landlord inbox'],
    seconds: 15,
    honesty:
      'In a fresh, reset demo the row reads Awaiting applicant approval until the newcomer approves.',
  },
  {
    id: 'landlord-decision',
    tracks: ['demo', 'features'],
    surface: 'landlord',
    href: '/landlord/applications/app_seed_06',
    target: 'main section',
    title: 'A decision with reasons, and no salary',
    summary:
      'The landlord gets employer backing and a risk summary with a reason on every point, never the salary.',
    say: [
      'The landlord sees the employer backing and a risk summary, with a reason for every point.',
      'On affordability it gives a yes or no and a plain margin note. It never shows the salary or a ratio.',
      'Then the landlord decides, and the decision flows back to Anders.',
    ],
    show: [
      'Point at Application assessment, then Employer backing and Rent against income.',
      'On a wide screen the guide covers the decision panel, so press Esc to collapse it first. Under Your decision choose Offer lease terms, pick 4 cheques, add a short note and press Save lease offer. If the page shows Start review first, press it.',
    ],
    features: ['Risk reasoning', 'No salary shared', 'Landlord decision'],
    seconds: 20,
    honesty: 'The risk summary is an illustrative assessment. Nothing is sent to a real landlord.',
  },
  {
    id: 'employer-live',
    tracks: ['demo', 'features'],
    surface: 'employer',
    href: '/employer/hires/hire_seed_04',
    target: 'main section:has([role="progressbar"])',
    title: 'The employer sees the move, untouched',
    summary: 'The hire moves forward without anyone updating a spreadsheet or chasing a landlord.',
    say: [
      'Now the employer’s window. Do not reload.',
      'Find and rent a home is Done, and the count has moved from two of nine to three of nine.',
      'The waiting-for-approval notice is gone. Nobody touched this page.',
    ],
    show: [
      'Switch to the employer window on Anders Lindqvist.',
      'Point at the progress count and at Find and rent a home, now Done.',
      'Point out that A personal approval is waiting is gone.',
    ],
    features: ['Live sync', 'Hire detail'],
    seconds: 15,
  },

  // Feature stops (features track only)
  {
    id: 'employer-overview',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer',
    target: 'main section',
    title: 'Employer overview',
    summary: 'One screen for every journey underway, and what needs a person.',
    say: [
      'The employer sees every journey underway, and which ones are blocked or waiting.',
      'Personal data decisions stay with the hire. The employer can see that an approval is pending, not decide it.',
    ],
    show: [
      'Point at People in motion, Needs your attention and Awaiting hire approval.',
      'Open Review next step on a hire who needs attention.',
    ],
    features: ['Overview', 'Needs attention'],
    seconds: 20,
    honesty: 'The people and counts are illustrative demo data.',
  },
  {
    id: 'employer-pipeline',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer/hires',
    target:
      'div[role="group"][aria-label="Filter by status"], div[role="group"][aria-label="تصفية حسب الحالة"]',
    title: 'The hire pipeline',
    summary: 'Every hire, filterable by status and stage.',
    say: [
      'Nine hires, and each one is filterable by status: Needs attention, On track, Waiting, Blocked, Settled.',
      'Open any row to see that person’s journey.',
    ],
    show: [
      'Point at the status filters and their counts.',
      'Select Needs attention, then open a hire.',
    ],
    features: ['Pipeline', 'Filters'],
    seconds: 15,
  },
  {
    id: 'hire-journey',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer/hires/hire_seed_04',
    target: 'main section:has(h3)',
    title: 'One hire, step by step',
    summary:
      'Each step has an owner, a reason and a dependency, so a blocked step explains itself.',
    say: [
      'Every step has an owner and a reason. Emirates ID waits on the immigration authority.',
      'Tenancy registration depends on the home and the visa. The order is explained, not assumed.',
    ],
    show: [
      'Scroll An ordered path forward and read the Owner and Depends on lines.',
      'Point at Employer backing, and at Connected applications.',
      'Open the Documents and Trust passport tabs if asked what the employer can see.',
    ],
    features: ['Journey', 'Owners and dependencies', 'Employer backing'],
    seconds: 25,
  },
  {
    id: 'expansion-roadmap',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer/expansion',
    target: 'main section:has(h3)',
    title: 'Company setup roadmap',
    summary: 'The company’s own setup is an ordered roadmap, and it unlocks the team’s moves.',
    say: [
      'Before the team moves, the company has to exist. This is the Abu Dhabi branch setup.',
      'Reserve a trade name is done, Get your licence is in progress, and the rest unlock in order.',
      'There is also a saved recommendation, ADGM or mainland, with the reasons.',
    ],
    show: [
      'Point at Company setup progress, 1 of 6 steps.',
      'Read the roadmap: trade name, licence, office, establishment card, visa quota, entity bank account.',
      'Scroll to Why this path?.',
    ],
    features: ['Company setup', 'Ordered dependencies'],
    seconds: 25,
    honesty:
      'This is an illustrative setup. No licence or authority application is sent, and the recommendation is a saved demo one.',
  },
  {
    id: 'expansion-team',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer/expansion/team',
    target: 'main section:has(table)',
    title: 'The team move',
    summary: 'One company milestone unlocks every person’s own relocation journey.',
    say: [
      'Three people are planned: Eleanor Brooks, Arjun Nair and Hana Farouk.',
      'Their journeys start when the company’s visa quota step is complete. Until then each is Awaiting visa quota.',
      'Then each one enters the hire pipeline with employer backing.',
    ],
    show: [
      'Point at One company milestone unlocks every person.',
      'Point at the team table and the Journey column.',
      'Point at Team planning notes.',
    ],
    features: ['Team move', 'Household planning'],
    seconds: 20,
    honesty: 'Team members, timelines and salary totals are illustrative.',
  },
  {
    id: 'guard',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer/guard',
    target: 'main section',
    title: 'The Guard log, and what is not proven',
    summary:
      'Recorded sharing checks are visible, and the evaluation limitation is stated on the same page.',
    say: [
      'The log lists recorded demo checks: who, which destination, and why it was allowed or stopped.',
      'One recorded denial: salary can only be shared with landlords as a yes or no.',
      'And this is the honest part. An archived evaluation allowed 12 of 25 forbidden synthetic flows. A newer measurement of the deployed release denied all 25 in each of 3 runs, 75 of 75, but it only tests the policy decision. We do not claim the agent is proven safe.',
    ],
    show: [
      'Point at Archived evaluation: provenance failure recorded.',
      'Open View evidence & scope.',
      'Back in the Demo check log, open View check details on the Denied entry.',
    ],
    features: ['Guard log', 'Honest limitation', 'Evidence'],
    seconds: 25,
    honesty:
      'End-to-end safety is not proven. The archived evaluation allowed 12 of 25 forbidden synthetic flows in each of 3 runs. A newer HTTP measurement of the deployed release denied 75 of 75 attacks, but did not measure the model, end-to-end exfiltration or production prompt parity. The log is seeded demo records, not live measurements.',
  },
  {
    id: 'bank',
    tracks: ['features'],
    surface: 'bank',
    href: '/bank',
    target: 'section[aria-labelledby="bank-scope-title"]',
    title: 'The bank: permission comes first',
    summary:
      'The bank sees only what the newcomer agreed to share, and cannot grant permission for them.',
    say: [
      'Permission comes first. A bank officer cannot grant permission for an applicant.',
      'Applications that wait on the newcomer’s permission stay outside the queue.',
      'What the bank can see is split three ways: shared by policy, needs the newcomer’s permission, and outside this workspace.',
    ],
    show: [
      'Point at Permission comes first near the top of the page.',
      'Point at What the bank can see.',
      'Open Review application on Mei Lin Tan to show the officer’s three steps.',
    ],
    features: ['Bank onboarding', 'Permission first', 'Employer backing'],
    seconds: 20,
    honesty: 'The bank and the applicants are fictional, and figures are estimates.',
  },
  {
    id: 'rtl-dark',
    tracks: ['features'],
    surface: 'employer',
    href: '/employer',
    target: 'button[lang="ar"], button[lang="en"]',
    title: 'Arabic right-to-left and dark mode',
    summary: 'The same screens switch to Arabic, mirrored, and to a dark theme.',
    say: [
      'Language and theme are one tap away on every page.',
      'Arabic is right to left, and the layout mirrors with it.',
      'Dark mode follows the same tokens, so nothing needs a separate design.',
    ],
    show: [
      'Tap the language button, then switch back.',
      'Tap the theme button next to it.',
      'Open the newcomer app at phone width and repeat in Arabic.',
    ],
    features: ['Arabic RTL', 'Dark mode', 'Phone and desktop'],
    seconds: 20,
    honesty: 'A few recorded names and one generated roadmap note stay in their original language.',
  },
  {
    id: 'live-state',
    tracks: ['features'],
    surface: 'design',
    href: '/design-system/state',
    target: 'main header',
    title: 'Live state and Reset demo',
    summary:
      'One shared record, watched live from any window, with a reset back to the first state.',
    say: [
      'This page shows the shared record itself: connection, revision, hires, and the agent feed.',
      'Change anything in another window and the revision moves here.',
      'Reset demo puts every open window back to the starting state. Do it before every run.',
    ],
    show: [
      'Point at Connection: live and the Revision count.',
      'Point at Reset demo. Do not press it during the tour.',
    ],
    features: ['Live sync', 'Reset demo'],
    seconds: 20,
    honesty: 'State lives in memory. A server restart is the same as Reset demo.',
  },

  // Closing (demo + features)
  {
    id: 'closing',
    tracks: ['demo', 'features'],
    surface: 'hub',
    href: '/',
    target: 'section[aria-labelledby="hub-real"]',
    title: 'What is real, and what is demo',
    summary:
      'The working record and consent flow are real; the outside world and the numbers are simulated.',
    say: [
      'What is real: one shared record, live across windows, and an agent that waits for consent.',
      'What is demo: landlords, banks and government are simulated, extraction is a preview, and the money figures are illustrative.',
      'And end-to-end safety is not proven. We say so rather than claim it.',
    ],
    show: [
      'Point at the three statements under What is real in this demo.',
      'Open Reset demo in Presenter tools, or Live state, to put the story back to its first state.',
    ],
    features: ['Honest scope', 'Reset demo'],
    seconds: 10,
    honesty:
      'Nothing leaves the app. Extraction is a labelled preview, money figures are illustrative, and end-to-end safety is not proven.',
  },
];
