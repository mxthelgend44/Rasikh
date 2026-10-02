import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  FileText,
  House,
  ShieldCheck,
} from 'lucide-react';
import '@fontsource-variable/inter';
import './landing.css';
import { GuardDemo } from '@/components/landing/guard-demo';
import { Journeys } from '@/components/landing/journeys';
import { Reveal } from '@/components/landing/reveal';
import { SiteHeader } from '@/components/landing/site-header';

/** Named for orientation only: Rasikh is independent of every entity listed. */
const entities = [
  'ICP',
  'Abu Dhabi Municipality',
  'Department of Health',
  'ADEK',
  'Department of Economic Development',
  'ADGM',
  'KEZAD',
  'Masdar City Free Zone',
  'twofour54',
];

const setupSteps = ['Trade name', 'Economic licence', 'Establishment card', 'Visa quota'];

export default function LandingPage() {
  return (
    <div className="lp" id="top">
      <SiteHeader />

      <main>
        <section className="lp-hero" aria-labelledby="hero-title">
          <div className="lp-hero-media" aria-hidden="true">
            <Image
              src="/images/corniche-arrival.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="lp-hero-image"
            />
          </div>
          <div className="lp-shell lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow lp-rise" style={{ animationDelay: '80ms' }}>
                Relocation and company landing · Abu Dhabi
              </p>
              <h1
                id="hero-title"
                className="lp-display lp-rise"
                style={{ animationDelay: '160ms' }}
              >
                Arrive already <em>settled</em>.
              </h1>
              <p className="lp-lede lp-rise" style={{ animationDelay: '260ms' }}>
                Rasikh turns a move to Abu Dhabi into one plan. Visa, home, bank and school follow
                in the right order, and your documents only go where you say.
              </p>
              <div className="lp-actions lp-rise" style={{ animationDelay: '360ms' }}>
                <a href="#start" className="lp-button">
                  Start your plan <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a href="#privacy" className="lp-link">
                  How your data stays yours <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="lp-hero-cards" aria-label="Example of a plan in progress">
              <article className="glass lp-float-card lp-card-a">
                <span className="lp-chip is-progress">Under review</span>
                <h2>Residence visa</h2>
                <p>Medical fitness test booked</p>
                <div className="lp-meter" aria-hidden="true">
                  <span style={{ width: '62%' }} />
                </div>
              </article>
              <article className="glass lp-float-card lp-card-b">
                <span className="lp-chip is-ready">Ready to apply</span>
                <h2>Tenancy · Tawtheeq</h2>
                <p>
                  <Check size={14} aria-hidden="true" /> 3 of 3 documents on file
                </p>
              </article>
              <article className="glass lp-float-card lp-card-c">
                <ShieldCheck size={18} aria-hidden="true" />
                <p>
                  Salary kept private. <strong>Affordability: yes</strong> shared with the landlord.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="lp-entities" aria-label="Services Rasikh helps you prepare for">
          <p className="lp-shell lp-entities-label">
            Prepares you for the services you will use anyway
          </p>
          <div className="lp-marquee" aria-hidden="true">
            <div className="lp-marquee-track">
              {[...entities, ...entities].map((entity, index) => (
                <span key={`${entity}-${index}`}>{entity}</span>
              ))}
            </div>
          </div>
          <ul className="lp-visually-hidden">
            {entities.map((entity) => (
              <li key={entity}>{entity}</li>
            ))}
          </ul>
        </section>

        <section className="lp-section lp-shell" id="journeys" aria-labelledby="journeys-title">
          <Reveal className="lp-section-head">
            <p className="lp-eyebrow">One plan, three journeys</p>
            <h2 id="journeys-title" className="lp-heading">
              Every step knows what it needs, and what comes next.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Journeys />
          </Reveal>
        </section>

        <section className="lp-privacy" id="privacy" aria-labelledby="privacy-title">
          <div className="lp-shell lp-privacy-grid">
            <Reveal className="lp-privacy-copy">
              <p className="lp-eyebrow is-light">The trust passport</p>
              <h2 id="privacy-title" className="lp-heading is-light">
                Your data moves only where you said it could.
              </h2>
              <p className="lp-body is-light">
                Before anything leaves, a privacy check compares each document with your settings. A
                landlord can learn that you can afford the rent without ever seeing your salary. A
                school gets the records it needs, and never your passport.
              </p>
              <dl className="lp-facts">
                <div>
                  <dt>9</dt>
                  <dd>kinds of personal data, each labelled</dd>
                </div>
                <div>
                  <dt>7</dt>
                  <dd>destinations, each with its own rules</dd>
                </div>
                <div>
                  <dt>1</dt>
                  <dd>switch to take any permission back</dd>
                </div>
              </dl>
            </Reveal>
            <Reveal delay={160}>
              <GuardDemo />
            </Reveal>
          </div>
        </section>

        <section
          className="lp-section lp-shell lp-companies"
          id="companies"
          aria-labelledby="companies-title"
        >
          <Reveal className="lp-companies-media">
            <Image
              src="/images/heritage-courtyard.webp"
              alt="Colleagues sharing coffee in a heritage courtyard in Abu Dhabi"
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
              className="lp-cover"
            />
            <div className="glass lp-setup-card">
              <p className="lp-setup-title">
                <Building2 size={16} aria-hidden="true" /> Company setup
              </p>
              <ol>
                {setupSteps.map((step, index) => (
                  <li key={step} className={index < 2 ? 'is-done' : index === 2 ? 'is-now' : ''}>
                    <span aria-hidden="true">
                      {index < 2 ? <Check size={12} strokeWidth={3} /> : index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal className="lp-companies-copy" delay={120}>
            <p className="lp-eyebrow">For companies</p>
            <h2 id="companies-title" className="lp-heading">
              Open your Abu Dhabi entity. Bring your people with it.
            </h2>
            <p className="lp-body">
              Choose between mainland and free zones with the trade-offs explained. Then follow the
              setup steps in order: each one shows what it is waiting on. When your visa quota
              lands, your first hires start their own relocation plans, backed by you.
            </p>
            <ul className="lp-ticks">
              <li>
                <FileText size={16} aria-hidden="true" /> Trade name check before you commit
              </li>
              <li>
                <House size={16} aria-hidden="true" /> Employer-backed rental applications for every
                hire
              </li>
              <li>
                <ShieldCheck size={16} aria-hidden="true" /> HR sees progress, not private documents
              </li>
            </ul>
          </Reveal>
        </section>

        <section className="lp-closing" id="start" aria-labelledby="start-title">
          <Image
            src="/images/mangroves.webp"
            alt=""
            fill
            sizes="100vw"
            className="lp-cover"
            aria-hidden="true"
          />
          <Reveal className="lp-shell lp-closing-inner">
            <div className="glass lp-closing-card">
              <p className="lp-eyebrow" lang="ar">
                أهلاً بك في أبوظبي
              </p>
              <h2 id="start-title" className="lp-heading">
                Your first week here can feel like your fifth year.
              </h2>
              <p className="lp-body">Tell us who is moving and when. We will lay out the route.</p>
              <a href="#top" className="lp-button">
                Start your plan <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-shell lp-footer-row">
          <span className="lp-wordmark">
            Rasikh <small lang="ar">راسخ</small>
          </span>
          <p>
            Rasikh is independent and not affiliated with any government entity. Requirements and
            fees shown are estimates; always confirm with the official service.
          </p>
        </div>
      </footer>
    </div>
  );
}
