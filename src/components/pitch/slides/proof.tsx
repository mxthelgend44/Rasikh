'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { BUILT_TODAY, SECURITY_EVIDENCE } from '../content';
import {
  EASE,
  Eyebrow,
  Footnote,
  Headline,
  Lede,
  Mark,
  Slide,
  fade,
  rise,
  stagger,
  useCountUp,
  useLoop,
} from '../primitives';

function Counter({ to, unit }: { to: number; unit?: string }) {
  const value = useCountUp(to, 1500, 500);
  return (
    <span className="pd-count">
      {value}
      {unit && <small>{unit}</small>}
    </span>
  );
}

const attacks = [
  'Fresh “summary” after reading a passport',
  'Salary slip relabelled as derived',
  'Health data hidden in a TAMM call',
  'Consent reused for another destination',
  'Redacted copy that is not redacted',
];

export function SecuritySlide() {
  const frame = useLoop(attacks.length, 1700);
  return (
    <Slide section="Security evidence" number={13}>
      <div className="pd-security">
        <div>
          <Eyebrow>Similar to OpenAPPA, tested like it matters</Eyebrow>
          <Headline>
            Every forbidden flow we could think of is refused, and an independent suite agrees.
          </Headline>
          <motion.div className="pd-attack" variants={fade}>
            <motion.span
              key={frame}
              className="pd-attack-pill"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: [-40, 150, 120], opacity: [0, 1, 0.9] }}
              transition={{ duration: 1.1, times: [0, 0.7, 1], ease: EASE }}
            >
              {attacks[frame]}
            </motion.span>
            <motion.span
              className="pd-attack-wall"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.5, delay: 0.75 }}
              key={`w${frame}`}
            >
              <ShieldCheck size={22} /> denied
            </motion.span>
          </motion.div>
        </div>
        <motion.div className="pd-evidence" variants={stagger(0.3, 0.1)}>
          {SECURITY_EVIDENCE.map((item) => (
            <motion.article key={item.label} variants={rise}>
              <Counter to={item.value} unit={item.unit} />
              <h3>{item.label}</h3>
              <p>{item.detail}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
      <Footnote>
        Measured on main on 2 October 2026. Commands to reproduce each number are in the research
        brief.
      </Footnote>
    </Slide>
  );
}

const reasons = [
  {
    title: 'Ordered, not listed',
    body: 'Prerequisites resolve into one sequence, so nothing is applied for too early.',
  },
  {
    title: 'Minimum disclosure by default',
    body: 'Each party sees only what the policy and the newcomer allow, enforced in code and in the database.',
  },
  {
    title: 'Refusals that help',
    body: 'When the guard says no, it says what would make it yes, and proves it.',
  },
  {
    title: 'Built for the employer relationship',
    body: 'The company that hires is the one that backs the move, from licence to lease.',
  },
];

export function WhySlide() {
  return (
    <Slide section="Why Rasikh" number={14}>
      <Eyebrow>What makes the approach distinct</Eyebrow>
      <Headline>Not another checklist. A plan that can be trusted with your documents.</Headline>
      <motion.div className="pd-reasons" variants={stagger(0.3, 0.12)}>
        {reasons.map((reason, index) => (
          <motion.article key={reason.title} variants={rise}>
            <motion.span
              className="pd-reason-rule"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5 + index * 0.12, duration: 0.9, ease: EASE }}
            />
            <h3>{reason.title}</h3>
            <p>{reason.body}</p>
          </motion.article>
        ))}
      </motion.div>
      <Footnote>
        A claim about the design, not about competitors lacking any of these capabilities.
      </Footnote>
    </Slide>
  );
}

export function BuiltSlide() {
  return (
    <Slide section="What is built today" number={15}>
      <Eyebrow>Honest status</Eyebrow>
      <Headline>What works, what is a prototype, and what is still a plan.</Headline>
      <motion.table className="pd-status" variants={fade}>
        <tbody>
          {BUILT_TODAY.map((row, index) => (
            <motion.tr
              key={row.part}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: EASE }}
            >
              <th>{row.part}</th>
              <td>
                <span className={`pd-state is-${row.state}`}>{row.state}</span>
              </td>
              <td>{row.note}</td>
            </motion.tr>
          ))}
        </tbody>
      </motion.table>
    </Slide>
  );
}

const metrics = [
  { name: 'Days to settled', body: 'From offer to tenancy, bank and school, per hire' },
  { name: 'Documents re-sent', body: 'How often the same document is asked for again' },
  { name: 'Refusals resolved', body: 'Guard refusals fixed by the suggested remedy' },
  { name: 'HR hours per hire', body: 'Coordination time the employer spends' },
];

export function ValueSlide() {
  return (
    <Slide section="Value to demonstrate" number={16}>
      <Eyebrow>What a pilot should measure</Eyebrow>
      <Headline>We will show value with a pilot before we claim any savings.</Headline>
      <motion.div className="pd-metrics" variants={stagger(0.3, 0.12)}>
        {metrics.map((metric, index) => (
          <motion.article key={metric.name} variants={rise}>
            <svg viewBox="0 0 120 40" aria-hidden="true">
              <motion.path
                d={index % 2 ? 'M0 10 C 30 12, 60 26, 120 34' : 'M0 34 C 30 30, 60 14, 120 8'}
                fill="none"
                stroke={index % 2 ? '#183a3a' : '#a65b43'}
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.6 + index * 0.15, duration: 1.2, ease: EASE }}
              />
            </svg>
            <h3>{metric.name}</h3>
            <p>{metric.body}</p>
          </motion.article>
        ))}
      </motion.div>
      <Footnote>Dashed lines show the direction we intend to test, not measured results.</Footnote>
    </Slide>
  );
}

export function CustomerSlide() {
  return (
    <Slide section="First customer" number={17}>
      <div className="pd-split">
        <div>
          <Eyebrow>Where we start</Eyebrow>
          <Headline>A company opening in Abu Dhabi, moving its first team.</Headline>
          <Lede>
            Hub71 companies set up an entity and bring people at the same time. That one buyer feels
            the whole chain: licence, visa quota, then every hire&apos;s move. We would start with
            one company and its first few hires.
          </Lede>
        </div>
        <motion.div className="pd-rings" variants={fade} aria-hidden="true">
          {[
            'Every newcomer to Abu Dhabi',
            'Companies hiring from abroad',
            'Hub71 companies landing a team',
          ].map((label, index) => (
            <motion.span
              key={label}
              className={`pd-ring is-${index}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.25, duration: 0.9, ease: EASE }}
            >
              <em>{label}</em>
            </motion.span>
          ))}
        </motion.div>
      </div>
      <Footnote>
        No signed pilot or customer is implied. Market sizing is work still to do.
      </Footnote>
    </Slide>
  );
}

const model = [
  { who: 'Employer', what: 'Per-hire relocation plan, with the guard and the services included' },
  {
    who: 'Company landing',
    what: 'Setup pathway, from trade name to visa quota and the first hires',
  },
  {
    who: 'Partners',
    what: 'Landlords and banks receive verified, minimum-disclosure applications',
  },
];

export function ModelSlide() {
  return (
    <Slide section="Proposed business model" number={18}>
      <Eyebrow>Who pays</Eyebrow>
      <Headline>The employer pays, because the employer carries the cost of a slow move.</Headline>
      <motion.div className="pd-model" variants={stagger(0.3, 0.15)}>
        {model.map((row) => (
          <motion.div key={row.who} variants={rise}>
            <strong>{row.who}</strong>
            <p>{row.what}</p>
          </motion.div>
        ))}
      </motion.div>
      <Footnote>
        A proposal to validate with buyers. No prices are stated until customer discovery supports
        them.
      </Footnote>
    </Slide>
  );
}

const roadmap = [
  { when: 'Now', what: 'Guard, TAMM MCP and data layer working; product surfaces in progress' },
  { when: 'Next', what: 'A pilot with one Hub71 company and its first hires' },
  { when: 'Then', what: 'Real service integrations and UAE PASS, where approvals allow' },
  { when: 'Later', what: 'Every newcomer to Abu Dhabi, employer-backed or not' },
];

export function RoadmapSlide() {
  return (
    <Slide section="Development roadmap" number={19}>
      <Eyebrow>From prototype to pilot</Eyebrow>
      <Headline>Earn each step with evidence before taking the next.</Headline>
      <motion.div className="pd-roadmap" variants={fade}>
        <motion.span
          className="pd-roadmap-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 1.6, ease: EASE }}
        />
        {roadmap.map((stop, index) => (
          <motion.div
            key={stop.when}
            className={`pd-roadmap-stop ${index === 0 ? 'is-now' : ''}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.35, duration: 0.6, ease: EASE }}
          >
            <span />
            <strong>{stop.when}</strong>
            <p>{stop.what}</p>
          </motion.div>
        ))}
      </motion.div>
      <Footnote>Horizons are planning intentions, not committed dates.</Footnote>
    </Slide>
  );
}

export function ClosingSlide() {
  return (
    <Slide tone="ink" section="The next conversation" number={20} className="pd-closing">
      <motion.div variants={rise}>
        <Mark size={64} spin />
      </motion.div>
      <Headline size="xl">
        Bring us your next team <em>moving to Abu Dhabi</em>.
      </Headline>
      <Lede>
        We are looking for one company to co-design the first pilot with: its hires, its landlord
        and bank partners, and what success means.
      </Lede>
      <motion.a
        className="pd-closing-link"
        href="/pitch/research"
        target="_blank"
        rel="noopener noreferrer"
        variants={rise}
      >
        Research and evidence brief <ArrowUpRight size={16} />
      </motion.a>
    </Slide>
  );
}
