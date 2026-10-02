'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    title: 'Tell us who is moving',
    body: 'A job, a family or a whole team. Rasikh lays out every service in the order it has to happen.',
    icon: FileText,
    visual: ['Residence visa', 'Emirates ID', 'Tenancy (Tawtheeq)', 'Bank account'],
  },
  {
    title: 'See what each step needs',
    body: 'Each service shows the documents it asks for and which ones you already hold, so nothing is applied for too early.',
    icon: Search,
    visual: ['Passport ✓', 'Emirates ID ✓', 'Signed lease: missing'],
  },
  {
    title: 'Share only what is needed',
    body: 'Before anything is sent, a privacy check compares each document with your settings. A landlord can see that you can afford the rent without seeing your salary.',
    icon: ShieldCheck,
    visual: ['Employment letter → allowed', 'Salary slip → stopped', 'Affordability: yes → sent'],
  },
  {
    title: 'Settle in, step by step',
    body: 'Applications move from submitted to approved, and each one unlocks the next. Your employer sees progress, not your private documents.',
    icon: Check,
    visual: ['Visa approved', 'Emirates ID approved', 'Tenancy registered'],
  },
];

/** A sticky visual on the right that changes as each step on the left scrolls into the middle. */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const step = steps[active] ?? steps[0];
  if (!step) return null;
  const Icon = step.icon;

  return (
    <div className="lp-how">
      <ol className="lp-how-steps">
        {steps.map((item, index) => (
          <li
            key={item.title}
            data-step={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className={index === active ? 'is-active' : ''}
          >
            <span className="lp-how-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ol>
      <div className="lp-how-sticky">
        <div className="lp-how-visual glass">
          <div className="lp-how-progress" aria-hidden="true">
            {steps.map((_, index) => (
              <i key={index} className={index <= active ? 'is-on' : ''} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="lp-how-icon">
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <p className="lp-how-visual-title">{step.title}</p>
              <ul>
                {step.visual.map((line, index) => (
                  <motion.li
                    key={line}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.15 + index * 0.12,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={
                      line.includes('stopped') || line.includes('missing') ? 'is-warn' : ''
                    }
                  >
                    {line}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
