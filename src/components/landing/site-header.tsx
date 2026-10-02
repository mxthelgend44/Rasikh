'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const links = [
  { href: '#journeys', label: 'Journeys' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#companies', label: 'For companies' },
];

/** Transparent over the hero, frosted once the page scrolls. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lp-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="lp-shell lp-header-row">
        <a href="#top" className="lp-brand" aria-label="Rasikh home">
          <span className="lp-mark" aria-hidden="true">
            <span />
          </span>
          <span className="lp-wordmark">
            Rasikh <small lang="ar">راسخ</small>
          </span>
        </a>
        <nav aria-label="Main" className="lp-nav">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#start" className="lp-button lp-button-small">
          Start your plan <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
