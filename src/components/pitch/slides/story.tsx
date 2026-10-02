'use client';

import { motion } from 'framer-motion';
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

export function TitleSlide() {
  return (
    <Slide tone="ink" className="pd-title">
      <motion.div className="pd-title-lockup" variants={rise}>
        <Mark size={84} spin />
        <div>
          <h1 className="pd-title-word">Rasikh</h1>
          <p className="pd-title-ar" lang="ar">
            راسخ
          </p>
        </div>
      </motion.div>
      <motion.p className="pd-title-line" variants={rise}>
        Arrive in Abu Dhabi <em>already settled</em>.
      </motion.p>
      <motion.svg
        className="pd-title-horizon"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M0 90 C 200 40, 380 110, 600 70 S 1000 30, 1200 80"
          fill="none"
          stroke="#e6b39b"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 2.4, delay: 0.6, ease: EASE }}
        />
      </motion.svg>
      <Footnote>Relocation and company landing · Hub71 · 2026</Footnote>
    </Slide>
  );
}

const journey = [
  { day: 'Day 0', text: 'Offer signed in Bengaluru' },
  { day: 'Day 3', text: 'Visa documents requested, twice' },
  { day: 'Day 11', text: 'Flat found; landlord asks for salary slips' },
  { day: 'Day 19', text: 'Bank needs a tenancy that needs an Emirates ID' },
  { day: 'Day 30', text: 'Still not settled' },
];

export function ScenarioSlide() {
  const step = useLoop(journey.length + 1, 1300);
  return (
    <Slide section="The move" number={2}>
      <Eyebrow>An illustrative journey</Eyebrow>
      <Headline>
        Priya accepts a job in Abu Dhabi. <em>Then the paperwork starts.</em>
      </Headline>
      <motion.ol className="pd-journey" variants={fade}>
        <motion.span
          className="pd-journey-line"
          animate={{ scaleY: Math.min(step, journey.length) / journey.length }}
          transition={{ duration: 0.8, ease: EASE }}
        />
        {journey.map((item, index) => (
          <motion.li
            key={item.day}
            animate={{ opacity: index < step ? 1 : 0.18, x: index < step ? 0 : 12 }}
            transition={{ duration: 0.6, ease: EASE }}
            className={index === journey.length - 1 ? 'is-last' : ''}
          >
            <span>{item.day}</span>
            {item.text}
          </motion.li>
        ))}
      </motion.ol>
      <Footnote>A composite scenario for illustration, not a customer case.</Footnote>
    </Slide>
  );
}

const pathway = [
  { x: 80, label: 'Offer', who: 'Employer' },
  { x: 290, label: 'Residence visa', who: 'ICP' },
  { x: 500, label: 'Emirates ID', who: 'ICP' },
  { x: 710, label: 'Tenancy (Tawtheeq)', who: 'Municipality' },
  { x: 920, label: 'Bank and utilities', who: 'Bank · provider' },
  { x: 1120, label: 'Settled', who: 'Family · school' },
];

export function PathwaySlide() {
  return (
    <Slide section="The first 30 days" number={3}>
      <Eyebrow>The landing pathway</Eyebrow>
      <Headline>Each step unlocks the next, and each one asks for documents again.</Headline>
      <motion.svg
        className="pd-pathway"
        viewBox="0 0 1200 300"
        variants={fade}
        aria-label="Pathway from offer to settled"
      >
        <motion.path
          d="M80 150 C 180 60, 230 60, 290 150 S 420 240, 500 150 S 640 60, 710 150 S 860 240, 920 150 S 1060 60, 1120 150"
          fill="none"
          stroke="#183a3a"
          strokeWidth="2"
          strokeDasharray="1 0"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3.2, delay: 0.5, ease: 'easeInOut' }}
        />
        {pathway.map((point, index) => (
          <motion.g
            key={point.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + index * 0.52, ease: EASE }}
          >
            <circle
              cx={point.x}
              cy={150}
              r={index === pathway.length - 1 ? 11 : 8}
              fill={index === pathway.length - 1 ? '#a65b43' : '#f8f6f0'}
              stroke="#183a3a"
              strokeWidth="2"
            />
            <text x={point.x} y={index % 2 ? 262 : 38} textAnchor="middle" className="pd-svg-label">
              {point.label}
            </text>
            <text x={point.x} y={index % 2 ? 284 : 60} textAnchor="middle" className="pd-svg-sub">
              {point.who}
            </text>
          </motion.g>
        ))}
        <motion.circle
          r="5"
          fill="#a65b43"
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{
            duration: 3.2,
            delay: 0.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 1.6,
          }}
          style={{
            offsetPath:
              "path('M80 150 C 180 60, 230 60, 290 150 S 420 240, 500 150 S 640 60, 710 150 S 860 240, 920 150 S 1060 60, 1120 150')",
          }}
        />
      </motion.svg>
      <Footnote>
        Order shown for a typical employer-sponsored move. Requirements vary; always confirm with
        the service.
      </Footnote>
    </Slide>
  );
}

const actors = [
  { id: 'newcomer', label: 'Newcomer', x: 50, y: 50 },
  { id: 'employer', label: 'Employer', x: 18, y: 20 },
  { id: 'landlord', label: 'Landlord', x: 82, y: 20 },
  { id: 'bank', label: 'Bank', x: 85, y: 78 },
  { id: 'services', label: 'Government services', x: 15, y: 80 },
  { id: 'school', label: 'School', x: 50, y: 92 },
];

export function GapSlide() {
  const connected = useLoop(2, 2600, 1400) === 1;
  return (
    <Slide section="The coordination gap" number={4}>
      <div className="pd-split">
        <div>
          <Eyebrow>Everyone holds a piece</Eyebrow>
          <Headline>
            Six parties. No shared plan. The newcomer carries every document between them.
          </Headline>
          <Lede>
            Each party asks for documents on its own terms, and none of them sees what the others
            need. Personal data is emailed around in full because nobody can share just the part
            that matters.
          </Lede>
        </div>
        <motion.div className="pd-actors" variants={fade}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {actors.slice(1).map((actor) => (
              <motion.line
                key={actor.id}
                x1="50"
                y1="50"
                x2={actor.x}
                y2={actor.y}
                stroke={connected ? '#183a3a' : '#a65b43'}
                strokeWidth="0.35"
                animate={{
                  strokeDasharray: connected ? '0 0' : '1.6 2.4',
                  opacity: connected ? 0.7 : 0.5,
                }}
                transition={{ duration: 0.8 }}
              />
            ))}
          </svg>
          {actors.map((actor, index) => (
            <motion.span
              key={actor.id}
              className={`pd-actor ${actor.id === 'newcomer' ? 'is-center' : ''}`}
              style={{ left: `${actor.x}%`, top: `${actor.y}%` }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.6, ease: EASE }}
            >
              {actor.label}
            </motion.span>
          ))}
          <motion.p
            className="pd-actors-caption"
            key={String(connected)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {connected
              ? 'With Rasikh: one plan, each party sees only its part'
              : 'Today: documents forwarded in full, again and again'}
          </motion.p>
        </motion.div>
      </div>
    </Slide>
  );
}

const chain = [
  { id: 'visa', label: 'Residence visa', docs: ['Passport', 'Employment'] },
  { id: 'eid', label: 'Emirates ID', docs: ['Passport'] },
  { id: 'tw', label: 'Tawtheeq tenancy', docs: ['Passport', 'Emirates ID', 'Lease'] },
  { id: 'school', label: 'School place', docs: ['Family', 'Address'] },
];

export function ProblemSlide() {
  return (
    <Slide section="The problem" number={5}>
      <Eyebrow>The problem, in the services themselves</Eyebrow>
      <Headline>
        One move is a chain of dependent services. The passport alone is handed over{' '}
        <em>three times</em>.
      </Headline>
      <motion.div className="pd-chain" variants={stagger(0.4, 0.35)}>
        {chain.map((service, index) => (
          <motion.div key={service.id} className="pd-chain-node" variants={rise}>
            <span className="pd-chain-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{service.label}</h3>
            <ul>
              {service.docs.map((doc) => (
                <motion.li
                  key={doc}
                  className={doc === 'Passport' ? 'is-repeat' : ''}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.35, duration: 0.5, ease: EASE }}
                >
                  {doc}
                </motion.li>
              ))}
            </ul>
            {index < chain.length - 1 && <span className="pd-chain-arrow" aria-hidden="true" />}
          </motion.div>
        ))}
      </motion.div>
      <Footnote>
        Dependencies and documents follow Rasikh&apos;s service catalogue, which marks requirements
        as illustrative.
      </Footnote>
    </Slide>
  );
}
