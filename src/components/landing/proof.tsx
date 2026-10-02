'use client';

import { useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SECURITY_EVIDENCE } from '@/components/pitch/content';
import { useReducedMotion } from '@/lib/motion';

function CountWhenSeen({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, reduced]);

  return <span ref={ref}>{value}</span>;
}

/** The measured security evidence, counting up as it scrolls into view. */
export function Proof() {
  const shown = SECURITY_EVIDENCE.slice(0, 4);
  return (
    <div className="lp-proof">
      <div className="lp-proof-grid">
        {shown.map((item) => (
          <article key={item.label}>
            <p className="lp-proof-value">
              <CountWhenSeen to={item.value} />
              {item.unit && <small> {item.unit}</small>}
            </p>
            <h3>{item.label}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
      <a className="lp-link is-light" href="/pitch/research#security">
        How each number is measured <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </div>
  );
}
