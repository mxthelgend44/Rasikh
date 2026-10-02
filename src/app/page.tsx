'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Compass,
  MapPin,
  Menu,
  X,
} from 'lucide-react';

type Route = 'new-hire' | 'family' | 'team';
type Step = { title: string; summary: string; detail: string; people: string[]; help: string };
const routes: Record<Route, { label: string; intro: string; steps: Step[] }> = {
  'new-hire': {
    label: 'A new job',
    intro: 'A sample route for someone joining an Abu Dhabi employer.',
    steps: [
      {
        title: 'Start with your offer',
        summary: 'Know the route and gather the essentials.',
        detail:
          'Your employer confirms the route for your work and residence process. You can gather the documents they actually need before the move begins.',
        people: ['You', 'Employer'],
        help: 'Shows who owns each action and which documents are ready, missing, or waiting for review.',
      },
      {
        title: 'Prepare your arrival',
        summary: 'Keep official steps in view.',
        detail:
          'Work authorisation, medical checks, residence and Emirates ID follow the official route that applies to you. Some stages are already joined through UAE government services.',
        people: ['Employer', 'Official services'],
        help: 'Keeps the next prerequisite visible without pretending to replace an official service.',
      },
      {
        title: 'Find your place',
        summary: 'Get ready for a landlord decision.',
        detail:
          'Explore where you might live, prepare the evidence a chosen landlord asks for, and understand the tenancy steps for that property.',
        people: ['You', 'Landlord'],
        help: 'Makes the housing handoff clear and shows what can be prepared while another document is pending.',
      },
      {
        title: 'Get connected',
        summary: 'Move through banking and utilities.',
        detail:
          'A bank decides which account you can open under its own rules. Utility setup can follow a registered tenancy, depending on the property and provider.',
        people: ['Bank', 'Utility provider'],
        help: 'Keeps separate provider requirements in one view so you know what to ask for next.',
      },
    ],
  },
  family: {
    label: 'Moving with family',
    intro: 'A sample route with a few more people and decisions to consider.',
    steps: [
      {
        title: 'Plan the move together',
        summary: 'Make one list for the household.',
        detail:
          'Start with your work route and note which family documents, insurance details and school records may matter to your household.',
        people: ['You', 'Family', 'Employer'],
        help: 'Gives the household one shared view of what is ready and what still needs an answer.',
      },
      {
        title: 'Sort a place to live',
        summary: 'Prepare housing evidence early.',
        detail:
          'Look at the areas that fit daily life, then confirm a property and the landlord’s actual tenancy requirements. Housing evidence can matter for family residence.',
        people: ['You', 'Landlord'],
        help: 'Connects housing to later family steps without assuming every landlord has the same rules.',
      },
      {
        title: 'Arrange family residence',
        summary: 'Follow the route that applies to you.',
        detail:
          'The sponsor’s residence, housing, kinship documents and health coverage may all be relevant. The official authority decides which conditions apply.',
        people: ['You', 'Official services'],
        help: 'Shows dependencies and the source of each requirement before you submit anything.',
      },
      {
        title: 'Make room for school',
        summary: 'Keep enrollment records visible.',
        detail:
          'A chosen school may need identity, residence and previous school records. Some steps can start while an Emirates ID is pending, subject to the school’s rules.',
        people: ['Family', 'School'],
        help: 'Keeps school questions alongside the rest of the move so they do not get lost in email.',
      },
    ],
  },
  team: {
    label: 'Bringing a team',
    intro: 'A sample route for a company opening or expanding in Abu Dhabi.',
    steps: [
      {
        title: 'Choose your setup route',
        summary: 'Start with your activity and needs.',
        detail:
          'Mainland and Abu Dhabi’s free zones serve different activities. The right route depends on the business, its approvals, premises and where it will operate.',
        people: ['Founder', 'Setup authority'],
        help: 'Places the route decision before the hiring steps it may affect.',
      },
      {
        title: 'Get sponsor-ready',
        summary: 'Complete company prerequisites.',
        detail:
          'A new entity generally needs its licence and the relevant establishment or immigration setup before it can sponsor its own employees.',
        people: ['Company', 'Official services'],
        help: 'Shows which company action unlocks a team member’s next step.',
      },
      {
        title: 'Bring people over',
        summary: 'See each hire’s route and owner.',
        detail:
          'Every hire has a work and residence path, but not every person moves with the same documents or family needs.',
        people: ['HR', 'New hires'],
        help: 'Gives HR and each hire a clear, appropriately shared view of the journey.',
      },
      {
        title: 'Help them settle',
        summary: 'Look beyond the permit.',
        detail:
          'Housing, banking and family arrangements involve separate providers and decisions after the government steps.',
        people: ['New hires', 'Private providers'],
        help: 'Keeps those handoffs visible so the arrival feels coordinated, not fragmented.',
      },
    ],
  },
};
const routeIds: Route[] = ['new-hire', 'family', 'team'];

export default function HomePage() {
  const [route, setRoute] = useState<Route>('new-hire');
  const [selected, setSelected] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const current = routes[route];
  const step = current.steps[selected];
  function changeRoute(next: Route) {
    setRoute(next);
    setSelected(0);
  }

  return (
    <main id="top">
      <div className="site-shell">
        <header className="site-header">
          <a className="brand" href="#top" aria-label="Rasikh, back to top">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span className="brand-word">
              Rasikh <small lang="ar">راسخ</small>
            </span>
          </a>
          <nav
            className={menuOpen ? 'nav-links is-open' : 'nav-links'}
            aria-label="Main navigation"
          >
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#journey" onClick={() => setMenuOpen(false)}>
              Your journey
            </a>
            <a href="#abu-dhabi" onClick={() => setMenuOpen(false)}>
              Abu Dhabi
            </a>
          </nav>
          <a className="header-action" href="#journey">
            Explore the journey <ArrowUpRight size={16} strokeWidth={1.8} />
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> A WARMER WELCOME TO ABU DHABI
            </div>
            <h1 id="hero-title">
              A clearer way to make Abu Dhabi <em>home.</em>
            </h1>
            <p className="hero-description">
              A new job brings a lot of firsts. Rasikh is being designed to help you and the people
              supporting your move see what comes next, from the offer to the everyday details of
              settling in.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#journey">
                See the journey <ArrowRight size={18} strokeWidth={1.8} />
              </a>
              <a className="text-link" href="#how-it-works">
                How Rasikh helps <ArrowUpRight size={17} strokeWidth={1.7} />
              </a>
            </div>
            <div className="hero-footnote">
              <span className="footnote-symbol" aria-hidden="true">
                ✳
              </span>
              <span>One move. Many people. A plan everyone can follow.</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame">
              <Image
                src="/images/corniche-arrival.webp"
                alt="Illustrative scene of people walking by Abu Dhabi's Corniche and skyline"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
                className="hero-image"
              />
            </div>
            <div className="location-note">
              <span className="location-icon">
                <MapPin size={17} strokeWidth={1.7} />
              </span>
              <span>
                <strong>The Corniche</strong>
                <small>Abu Dhabi, UAE</small>
              </span>
            </div>
            <span className="hero-image-index">01 / A PLACE TO BEGIN</span>
          </div>
        </section>

        <div className="intro-rule" aria-hidden="true">
          <span lang="ar">راسخ</span>
          <span className="rule-line" />
          <span>ROOTED IN WHAT COMES NEXT</span>
        </div>

        <section className="section how-section" id="how-it-works" aria-labelledby="how-title">
          <div className="section-lead">
            <span className="section-kicker">THE IDEA</span>
            <h2 id="how-title">
              Moving is more than <em>arriving.</em>
            </h2>
          </div>
          <div className="how-content">
            <p className="section-intro">
              A work permit, a home, an account, a school place. Each has a different person behind
              it. Rasikh is designed to make the handoffs between them feel simpler.
            </p>
            <div className="principles">
              <article className="principle">
                <span className="principle-number">01</span>
                <div>
                  <h3>See the whole picture</h3>
                  <p>Know what is ready, what is next, and who is responsible.</p>
                </div>
                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
              </article>
              <article className="principle">
                <span className="principle-number">02</span>
                <div>
                  <h3>Prepare at the right time</h3>
                  <p>Gather what a chosen provider needs before the handoff.</p>
                </div>
                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
              </article>
              <article className="principle">
                <span className="principle-number">03</span>
                <div>
                  <h3>Share with care</h3>
                  <p>Keep personal details with the people you choose.</p>
                </div>
                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
              </article>
            </div>
          </div>
        </section>
      </div>

      <section className="journey-section" id="journey" aria-labelledby="journey-title">
        <div className="site-shell journey-shell">
          <div className="journey-heading">
            <div>
              <span className="section-kicker">AN INTERACTIVE PREVIEW</span>
              <h2 id="journey-title">
                What happens <em>next?</em>
              </h2>
            </div>
            <p>
              Every move is different. Choose a starting point to see how a clear plan could bring
              people and tasks together.
            </p>
          </div>
          <div className="journey-tabs" role="tablist" aria-label="Type of move">
            {routeIds.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={route === id}
                aria-controls="journey-panel"
                className={route === id ? 'journey-tab is-active' : 'journey-tab'}
                onClick={() => changeRoute(id)}
              >
                {routes[id].label}
              </button>
            ))}
          </div>
          <div
            className="journey-workspace"
            id="journey-panel"
            role="tabpanel"
            aria-label={current.label}
          >
            <div className="workspace-sidebar">
              <div className="workspace-label">
                <Compass size={17} strokeWidth={1.7} />
                <span>YOUR PATH</span>
              </div>
              <p>{current.intro}</p>
              <div className="step-list">
                {current.steps.map((item, index) => (
                  <button
                    type="button"
                    key={item.title}
                    aria-pressed={selected === index}
                    className={selected === index ? 'step-button is-active' : 'step-button'}
                    onClick={() => setSelected(index)}
                  >
                    <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="step-title">{item.title}</span>
                    {selected === index ? (
                      <ArrowUpRight size={17} strokeWidth={1.7} />
                    ) : (
                      <ChevronRight size={17} strokeWidth={1.7} />
                    )}
                  </button>
                ))}
              </div>
              <span className="sample-note">Sample journey · steps vary by route and provider</span>
            </div>
            <div className="workspace-detail" key={route + selected}>
              <div className="detail-topline">
                <span>
                  STEP {String(selected + 1).padStart(2, '0')} /{' '}
                  {String(current.steps.length).padStart(2, '0')}
                </span>
                <span className="concept-pill">CONCEPT PREVIEW</span>
              </div>
              <div className="detail-main">
                <span className="detail-overline">A LITTLE MORE CLARITY</span>
                <h3>{step.title}</h3>
                <p className="detail-short">{step.summary}</p>
                <p className="detail-description">{step.detail}</p>
                <div className="detail-people">
                  <span>PEOPLE INVOLVED</span>
                  <div>
                    {step.people.map((person) => (
                      <span className="person-tag" key={person}>
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="detail-bottom">
                <div className="detail-check">
                  <Check size={18} strokeWidth={2} />
                </div>
                <div>
                  <strong>Where Rasikh could help</strong>
                  <p>{step.help}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="journey-disclaimer">
            This preview shows a possible journey, not a live government, bank, landlord or school
            connection. Requirements depend on your route and the provider you choose.
          </p>
        </div>
      </section>

      <div className="site-shell">
        <section className="section place-section" id="abu-dhabi" aria-labelledby="place-title">
          <div className="place-header">
            <div>
              <span className="section-kicker">LIFE BEYOND THE CHECKLIST</span>
              <h2 id="place-title">
                Settle into a city,
                <br /> not just a process.
              </h2>
            </div>
            <p>
              Waterfront mornings. Coffee in a shaded courtyard. A quiet path through the mangroves.
              Abu Dhabi has room for the life you are coming here to build.
            </p>
          </div>
          <div className="place-grid">
            <article className="place-card">
              <div className="place-image">
                <Image
                  src="/images/heritage-courtyard.webp"
                  alt="Illustrative Abu Dhabi heritage courtyard gathering with Arabic coffee"
                  fill
                  loading="eager"
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              </div>
              <div className="place-caption">
                <div>
                  <span>HERITAGE & HOSPITALITY</span>
                  <h3>Find your people.</h3>
                </div>
                <ArrowUpRight size={23} strokeWidth={1.4} aria-hidden="true" />
              </div>
            </article>
            <article className="place-card">
              <div className="place-image">
                <Image
                  src="/images/mangroves.webp"
                  alt="Illustrative scene of a family on an Abu Dhabi mangrove boardwalk"
                  fill
                  loading="eager"
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              </div>
              <div className="place-caption">
                <div>
                  <span>THE COAST & MANGROVES</span>
                  <h3>Make space to breathe.</h3>
                </div>
                <ArrowUpRight size={23} strokeWidth={1.4} aria-hidden="true" />
              </div>
            </article>
          </div>
          <p className="image-note">Imagery is illustrative and inspired by Abu Dhabi.</p>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <div className="closing-symbol" aria-hidden="true">
            <span />
          </div>
          <div>
            <span className="section-kicker">RASIKH · راسخ</span>
            <h2 id="closing-title">
              Feel at home <em>sooner.</em>
            </h2>
            <p>
              A simpler beginning starts with knowing what happens next. Explore a sample journey
              and tell us where your own move would need more help.
            </p>
          </div>
          <a className="button button-light" href="#journey">
            Explore the journey <ArrowRight size={18} strokeWidth={1.8} />
          </a>
        </section>
        <footer className="site-footer">
          <div className="footer-brand">
            <span className="brand-mark brand-mark-small" aria-hidden="true">
              <span />
            </span>
            <span>Rasikh</span>
          </div>
          <p>For a clearer start in Abu Dhabi.</p>
          <div className="footer-links">
            <a href="#top">Back to top</a>
            <a href="https://github.com/mxthelgend44/Rasikh/blob/main/docs/problem-evidence.md">
              Our research <ArrowUpRight size={14} />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
