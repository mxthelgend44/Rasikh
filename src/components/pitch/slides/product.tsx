'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, FileText, Lock, Search, ShieldCheck, UserRound, X } from 'lucide-react';
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
  useLoop,
} from '../primitives';

export function IntroducingSlide() {
  return (
    <Slide tone="ink" section="Introducing" number={6} className="pd-intro">
      <motion.div className="pd-intro-mark" variants={rise}>
        <Mark size={120} spin />
      </motion.div>
      <Headline size="xl">
        Rasikh is one plan for the whole move, <em>with a privacy guard on every step</em>.
      </Headline>
      <Lede>
        For newcomers, their employer and the people they deal with: one ordered plan, and documents
        that only go where the newcomer allows.
      </Lede>
    </Slide>
  );
}

const pillars = [
  {
    icon: FileText,
    title: 'One ordered plan',
    body: 'Every service in dependency order, with what each one still needs.',
  },
  {
    icon: ShieldCheck,
    title: 'A guard on every send',
    body: 'Each document is checked against the newcomer’s settings before it leaves.',
  },
  {
    icon: Search,
    title: 'Services, found and prepared',
    body: 'Search in English or Arabic; requirements and gaps worked out up front.',
  },
  {
    icon: Building2,
    title: 'Employer-backed',
    body: 'Companies set up, sponsor, and back each hire’s rental application.',
  },
];

export function SolutionSlide() {
  return (
    <Slide section="The proposed solution" number={7}>
      <Eyebrow>Four parts, one product</Eyebrow>
      <Headline>Plan the move, guard the data, prepare the services, back the hire.</Headline>
      <motion.div className="pd-pillars" variants={stagger(0.35, 0.14)}>
        {pillars.map(({ icon: Icon, title, body }, index) => (
          <motion.article key={title} variants={rise} className="pd-pillar">
            <motion.span
              className="pd-pillar-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.14, duration: 0.8, ease: EASE }}
            >
              <Icon size={22} strokeWidth={1.6} />
            </motion.span>
            <h3>{title}</h3>
            <p>{body}</p>
          </motion.article>
        ))}
      </motion.div>
    </Slide>
  );
}

const stages = [
  { id: 'agent', title: 'Agent', body: 'Drafts each step' },
  { id: 'guard', title: 'Rasikh Guard', body: 'Checks every send' },
  { id: 'tamm', title: 'TAMM MCP', body: 'Services and applications' },
  { id: 'data', title: 'Data layer', body: 'Firestore with rules' },
];

export function SystemSlide() {
  return (
    <Slide section="How the system works" number={8}>
      <Eyebrow>The architecture</Eyebrow>
      <Headline>Nothing leaves the agent without passing the guard.</Headline>
      <motion.div className="pd-system" variants={fade}>
        <svg
          className="pd-system-wires"
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path id="wire" d="M120 60 H 880" stroke="#d9ded5" strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              r="6"
              fill={i === 1 ? '#a65b43' : '#183a3a'}
              style={{ offsetPath: "path('M120 60 H 880')" }}
              initial={{ offsetDistance: '0%', opacity: 0 }}
              animate={{ offsetDistance: ['0%', '33%', '33%', '100%'], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 3.6,
                delay: 0.8 + i * 1.2,
                repeat: Infinity,
                times: [0, 0.3, 0.45, 1],
                ease: 'easeInOut',
              }}
            />
          ))}
        </svg>
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            className={`pd-stage ${stage.id === 'guard' ? 'is-guard' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.15, duration: 0.6, ease: EASE }}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{stage.title}</h3>
            <p>{stage.body}</p>
          </motion.div>
        ))}
      </motion.div>
      <motion.ul className="pd-system-notes" variants={stagger(1.2, 0.12)}>
        <motion.li variants={rise}>
          Reads are reported to the guard, so it knows what any later message could contain.
        </motion.li>
        <motion.li variants={rise}>
          Decisions use OpenAPPA&apos;s label algebra: a send is allowed only if every label in it
          may reach that destination.
        </motion.li>
        <motion.li variants={rise}>
          A refusal comes with the smallest fix, checked before it is offered.
        </motion.li>
      </motion.ul>
    </Slide>
  );
}

type DocState = 'idle' | 'checking' | 'ok' | 'stop' | 'swap';
const guardFrames: { caption: string; docs: [DocState, DocState, DocState] }[] = [
  {
    caption: 'The agent drafts a rental application to a landlord',
    docs: ['idle', 'idle', 'idle'],
  },
  {
    caption: 'Each document is checked before it leaves',
    docs: ['checking', 'checking', 'checking'],
  },
  {
    caption: 'Employment letter and passport may go: one is allowed, one was consented',
    docs: ['ok', 'ok', 'checking'],
  },
  {
    caption: 'The salary slip is stopped. Only a yes or no result may reach a landlord',
    docs: ['ok', 'ok', 'stop'],
  },
  {
    caption: 'The remedy: send the derived affordability signal instead',
    docs: ['ok', 'ok', 'swap'],
  },
];
const guardDocs = ['Employment letter', 'Passport', 'Salary slip'];
const ROW_TOP = ['24%', '50%', '76%'];

/** Where a document's packet sits along the wire, as a share of the stage width. */
function packetLeft(state: DocState): string {
  if (state === 'checking' || state === 'stop') return '53%';
  if (state === 'ok' || state === 'swap') return '70%';
  return '36%';
}

export function GuardMomentSlide() {
  const frame = useLoop(guardFrames.length, 2200);
  const current = guardFrames[frame] ?? guardFrames[0];
  const states = current?.docs ?? ['idle', 'idle', 'idle'];
  const received = guardDocs
    .map((name, index) => ({ name, state: states[index] ?? 'idle' }))
    .filter(({ state }) => state === 'ok' || state === 'swap')
    .map(({ name, state }) => (state === 'swap' ? 'Affordability: yes' : name));
  const stopped = states.includes('stop');

  return (
    <Slide section="The Guard moment" number={9} tone="ink">
      <div className="pd-split">
        <div>
          <Eyebrow>Privacy that explains itself</Eyebrow>
          <Headline>A landlord learns you can afford the rent. Not your salary.</Headline>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={frame}
              className="pd-guard-caption"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {current?.caption}
            </motion.p>
          </AnimatePresence>
        </div>
        <motion.div className="pd-guard-stage" variants={fade}>
          <svg
            className="pd-guard-wires"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {[24, 50, 76].map((y) => (
              <path
                key={y}
                d={`M36 ${y} C 45 ${y}, 45 50, 53 50 L 74 50`}
                fill="none"
                stroke="rgb(255 254 250 / 0.18)"
                strokeWidth="0.4"
              />
            ))}
          </svg>
          {guardDocs.map((name, index) => {
            const state = states[index] ?? 'idle';
            return (
              <div
                key={name}
                className={`pd-guard-doc is-${state}`}
                style={{ top: ROW_TOP[index] }}
              >
                <span className="pd-guard-doc-icon">
                  {state === 'ok' || state === 'swap' ? (
                    <Check size={14} />
                  ) : state === 'stop' ? (
                    <X size={14} />
                  ) : (
                    <FileText size={14} />
                  )}
                </span>
                {name}
              </div>
            );
          })}
          {guardDocs.map((name, index) => {
            const state = states[index] ?? 'idle';
            return (
              <motion.span
                key={`packet-${name}`}
                className={`pd-packet is-${state}`}
                initial={false}
                animate={{
                  left: packetLeft(state),
                  top: state === 'idle' ? ROW_TOP[index] : '50%',
                  opacity:
                    state === 'idle' ? 0 : state === 'ok' || state === 'swap' ? [1, 1, 0] : 1,
                  x: state === 'stop' ? [0, -6, 6, -4, 0] : 0,
                }}
                transition={{ duration: 0.9, ease: EASE }}
              >
                {state === 'swap' ? 'yes' : ''}
              </motion.span>
            );
          })}
          <motion.div
            className={`pd-guard-shield ${stopped ? 'is-stopping' : ''}`}
            animate={{ scale: stopped ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <ShieldCheck size={30} strokeWidth={1.4} />
            <span>Guard</span>
          </motion.div>
          <div className="pd-guard-landlord">
            <p>
              <UserRound size={18} strokeWidth={1.6} /> Landlord receives
            </p>
            <ul>
              <AnimatePresence initial={false}>
                {received.map((item) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className={item.startsWith('Affordability') ? 'is-derived' : ''}
                  >
                    {item}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </motion.div>
      </div>
      <Footnote>The captions match the real Guard decision and remedy for this request.</Footnote>
    </Slide>
  );
}

const toggles: { label: string; to: string; on: boolean }[] = [
  { label: 'Passport', to: 'Landlords', on: true },
  { label: 'Emirates ID', to: 'Banks', on: true },
  { label: 'Family details', to: 'Schools', on: false },
  { label: 'Salary', to: 'Banks', on: false },
];

export function PassportSlide() {
  const frame = useLoop(toggles.length + 2, 1500);
  const revoking = frame === toggles.length + 1;
  const isOn = (index: number) =>
    index < frame && Boolean(toggles[index]?.on) && !(revoking && index === 0);
  return (
    <Slide section="The trust passport" number={10}>
      <div className="pd-split">
        <div>
          <Eyebrow>Consent the newcomer controls</Eyebrow>
          <Headline>Each switch is one label, one destination, and can be taken back.</Headline>
          <Lede>
            Toggling a switch becomes exactly one consent in the guard. Switching it off revokes it
            before the next send. Pairs that consent cannot unlock, such as a passport to a school,
            are not offered at all.
          </Lede>
        </div>
        <motion.div className="pd-passport glass-panel" variants={fade}>
          {toggles.map((toggle, index) => {
            const on = isOn(index);
            return (
              <div key={toggle.label} className="pd-toggle-row">
                <span>
                  <strong>{toggle.label}</strong> to {toggle.to}
                </span>
                <motion.span className={`pd-toggle ${on ? 'is-on' : ''}`} layout>
                  <motion.i layout transition={{ duration: 0.35, ease: EASE }} />
                </motion.span>
              </div>
            );
          })}
          <div className="pd-ops">
            <AnimatePresence initial={false}>
              {toggles
                .filter((_, index) => isOn(index))
                .map((toggle) => (
                  <motion.code
                    key={toggle.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    grant {toggle.label.toLowerCase().replace(' ', '_')} → {toggle.to.toLowerCase()}
                  </motion.code>
                ))}
              {revoking && (
                <motion.code
                  key="revoke"
                  className="is-revoke"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  revoke passport → landlords · next send needs consent again
                </motion.code>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Slide>
  );
}

const queries = ['iqama', 'إقامة', 'tenacny contract'];
const results: Record<string, string> = {
  iqama: 'Issue a residence visa for an employee',
  إقامة: 'Issue a residence visa for an employee',
  'tenacny contract': 'Register a tenancy contract (Tawtheeq)',
};
const dag = ['Trade name', 'Economic licence', 'Establishment card', 'Visa quota'];

export function ServicesSlide() {
  const frame = useLoop(queries.length, 2600);
  const query = queries[frame] ?? queries[0] ?? '';
  return (
    <Slide section="Finding and ordering services" number={11}>
      <Eyebrow>TAMM MCP server</Eyebrow>
      <Headline>
        Ask the way people actually ask. Get the right service, and the order to do it in.
      </Headline>
      <div className="pd-services">
        <motion.div className="pd-search" variants={rise}>
          <div className="pd-search-box">
            <Search size={18} />
            <motion.span
              key={query}
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="pd-typed"
              dir="auto"
            >
              {query}
            </motion.span>
          </div>
          <motion.div
            key={query}
            className="pd-search-hit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
          >
            <strong>{results[query]}</strong>
            <span>Ranked first · Arabic, transliteration and typos understood</span>
          </motion.div>
        </motion.div>
        <motion.div className="pd-dag" variants={rise}>
          <p className="pd-dag-title">Prerequisites for a visa quota, in order</p>
          {dag.map((step, index) => (
            <motion.div
              key={step}
              className="pd-dag-node"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.35, duration: 0.6, ease: EASE }}
            >
              <span>{index + 1}</span>
              {step}
              {index < dag.length - 1 && (
                <motion.i
                  className="pd-dag-link"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.9 + index * 0.35, duration: 0.4 }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
      <Footnote>Served from a mock catalogue. No live TAMM API is connected.</Footnote>
    </Slide>
  );
}

const setup = ['Trade name', 'Licence', 'Establishment card', 'Visa quota'];

export function ExpansionSlide() {
  const frame = useLoop(setup.length + 2, 1300);
  const unlocked = frame >= setup.length;
  return (
    <Slide section="Company expansion" number={12}>
      <Eyebrow>For companies landing in Abu Dhabi</Eyebrow>
      <Headline>When the visa quota lands, the first hires start moving on their own.</Headline>
      <motion.div className="pd-expansion" variants={fade}>
        <div className="pd-setup-track">
          {setup.map((step, index) => (
            <motion.div
              key={step}
              className={`pd-setup-step ${index < frame ? 'is-done' : ''}`}
              animate={{ opacity: index < frame ? 1 : 0.35 }}
            >
              <span>{index < frame ? <Check size={14} /> : <Lock size={13} />}</span>
              {step}
            </motion.div>
          ))}
        </div>
        <div className="pd-hires">
          {['hire_demo_002', 'hire_demo_003', 'hire_demo_004'].map((hire, index) => (
            <motion.div
              key={hire}
              className="pd-hire"
              animate={{ opacity: unlocked ? 1 : 0.15, x: unlocked ? 0 : -40 }}
              transition={{ delay: unlocked ? index * 0.18 : 0, duration: 0.7, ease: EASE }}
            >
              <UserRound size={18} />
              <span>New hire {index + 1}</span>
              <em>relocation plan started</em>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Slide>
  );
}
