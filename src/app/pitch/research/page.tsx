import type { Metadata } from 'next';
import {
  BUILT_TODAY,
  DESTINATIONS,
  LABELS,
  MATRIX,
  REVIEWED_ON,
  SECURITY_EVIDENCE,
} from '@/components/pitch/content';

export const metadata: Metadata = {
  title: 'Rasikh · Research and evidence brief',
  description:
    'The problem, the system, the privacy policy and the measured security evidence behind Rasikh.',
};

const effectLabel: Record<string, string> = {
  allow: 'allow',
  deny: 'deny',
  consent: 'consent',
  derived: 'derived only',
  extraction: 'extraction only',
  redacted: 'redacted',
  insurance: 'insurance only',
};

const sections = [
  ['overview', 'Overview'],
  ['problem', 'Problem'],
  ['system', 'System'],
  ['policy', 'Privacy policy'],
  ['security', 'Security evidence'],
  ['status', 'Status'],
  ['validation', 'Validation plan'],
  ['limits', 'Limits'],
];

export default function ResearchPage() {
  return (
    <div className="rb">
      <header className="rb-top">
        <a href="/pitch">← Return to the pitch</a>
        <span>Rasikh · Evidence brief · {REVIEWED_ON}</span>
      </header>
      <main className="rb-main">
        <p className="rb-kicker">The story, the system and the evidence</p>
        <h1>
          One plan for the move.
          <br />
          <em>A guard on every step.</em>
        </h1>
        <p className="rb-lead">
          Rasikh helps people and companies move to Abu Dhabi. It orders the services a move depends
          on, and checks every document against the newcomer&apos;s settings before it reaches an
          employer, landlord, bank, school, government service or AI model.
        </p>
        <nav className="rb-nav" aria-label="Brief sections">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>

        <section id="overview">
          <p className="rb-kicker">01 / Overview</p>
          <h2>From forwarded documents to a guarded plan.</h2>
          <div className="rb-grid">
            <article>
              <h3>What Rasikh is building</h3>
              <p>
                A newcomer app, an employer and expansion dashboard, a privacy guard (Rasikh Guard),
                a service adapter for Abu Dhabi government services (TAMM MCP), and a Firestore data
                layer with security rules.
              </p>
            </article>
            <article>
              <h3>What is available today</h3>
              <p>
                Guard and the data layer work and are tested. TAMM is a prototype over a mock
                catalogue. UAE PASS is simulated. No live government integration, pilot or customer
                is implied.
              </p>
            </article>
          </div>
        </section>

        <section id="problem">
          <p className="rb-kicker">02 / Problem</p>
          <h2>Order and disclosure.</h2>
          <p>
            A move is a chain of dependent services: a residence visa before an Emirates ID, an
            Emirates ID before a registered tenancy, a tenancy before many bank and school steps.
            Each asks for documents again. In Rasikh&apos;s own catalogue, the passport alone is
            requested by three consecutive services.
          </p>
          <p>
            Because no party can receive just the part it needs, newcomers forward full documents: a
            salary slip to prove affordability, a whole passport to a school. The coordination
            problem is also a privacy problem.
          </p>
        </section>

        <section id="system">
          <p className="rb-kicker">03 / System</p>
          <h2>The system, stage by stage.</h2>
          <div className="rb-grid">
            <article>
              <h3>Agent</h3>
              <p>
                Drafts each step. Reports every labelled read to Guard, so later messages carry what
                was read.
              </p>
            </article>
            <article>
              <h3>Rasikh Guard</h3>
              <p>
                A fork of OpenAPPA. Every send is decided with OpenAPPA&apos;s label algebra: each
                flowing label contributes the destinations it may reach, and the meet must admit the
                destination. Refusals carry the smallest fix, verified by re-deciding the call.
              </p>
            </article>
            <article>
              <h3>TAMM MCP</h3>
              <p>
                Six MCP tools over a mock service catalogue: BM25 search with Arabic and typo
                tolerance, prerequisite ordering, readiness gaps, applications. Data-sending tools
                pass Guard first.
              </p>
            </article>
            <article>
              <h3>Data layer</h3>
              <p>
                Firestore with validating converters and rules that mirror the policy: an employer
                client can never read a health or bank-statement document.
              </p>
            </article>
          </div>
        </section>

        <section id="policy">
          <p className="rb-kicker">04 / Privacy policy</p>
          <h2>Nine kinds of data, seven destinations.</h2>
          <p>Product defaults for the demo, not legal statements.</p>
          <div className="rb-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  {DESTINATIONS.map((destination) => (
                    <th key={destination}>{destination.replace('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LABELS.map((label) => (
                  <tr key={label}>
                    <th>{label.replace('_', ' ')}</th>
                    {MATRIX[label].map((effect, index) => (
                      <td key={index} className={`rb-cell is-${effect}`}>
                        {effectLabel[effect]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="security">
          <p className="rb-kicker">05 / Security evidence</p>
          <h2>Measured, with the command to reproduce it.</h2>
          <div className="rb-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Result</th>
                  <th>What it shows</th>
                  <th>Reproduce</th>
                </tr>
              </thead>
              <tbody>
                {SECURITY_EVIDENCE.map((item) => (
                  <tr key={item.label}>
                    <th>
                      {item.value}
                      {item.unit ? ` ${item.unit}` : ''} {item.label}
                    </th>
                    <td>{item.detail}</td>
                    <td>
                      <code>{item.command}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rb-callout">
            <strong>A finding we fixed</strong>
            <p>
              The first independent evaluation found that a fresh, unlabelled &quot;summary&quot;
              ref could carry data the agent had read: 12 of 25 attacks were allowed. Unobserved
              refs now inherit everything observed in the session, the contract was clarified
              (1.1.1), and those 12 attacks are now regression tests. The same suite now reports 0
              forbidden allows over three runs.
            </p>
          </div>
        </section>

        <section id="status">
          <p className="rb-kicker">06 / Status</p>
          <h2>What works, and what does not yet.</h2>
          <div className="rb-grid">
            {BUILT_TODAY.map((row) => (
              <article key={row.part}>
                <span className={`rb-status is-${row.state}`}>{row.state}</span>
                <h3>{row.part}</h3>
                <p>{row.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="validation">
          <p className="rb-kicker">07 / Validation plan</p>
          <h2>What a pilot must show.</h2>
          <ol>
            <li>
              Days from offer to settled (tenancy, bank, school) per hire, against the
              company&apos;s previous moves.
            </li>
            <li>
              Documents requested more than once, and documents shared beyond what each party
              needed.
            </li>
            <li>
              Guard refusals, and how many the suggested remedy resolved without a support ticket.
            </li>
            <li>HR coordination time per hire, and newcomer satisfaction at day 30.</li>
          </ol>
        </section>

        <section id="limits">
          <p className="rb-kicker">08 / Limits</p>
          <h2>What this brief does not claim.</h2>
          <p>
            No market size, savings, customer, pilot or government integration. Service names are
            used for orientation; Rasikh is not affiliated with any government entity. Fees and
            requirements in the catalogue are illustrative. Guard decides per payload reference; it
            does not inspect free text, so the app must describe outbound content with references
            and report every read.
          </p>
        </section>
      </main>
    </div>
  );
}
