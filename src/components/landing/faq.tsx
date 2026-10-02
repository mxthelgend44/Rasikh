'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const questions = [
  {
    q: 'Does Rasikh replace TAMM or other government services?',
    a: 'No. Rasikh prepares you for them and keeps the steps in order. Applications are made through the official services, and requirements should always be confirmed there.',
  },
  {
    q: 'Who can see my documents?',
    a: 'Only the parties your settings allow. Every send is checked first, and some data never goes to some places: a school never receives your passport, and health details only go to insurance services.',
  },
  {
    q: 'Can I take a permission back?',
    a: 'Yes. Each permission covers one kind of data and one recipient. Switching it off applies before the next send.',
  },
  {
    q: 'What does it cost?',
    a: 'Rasikh is designed to be paid for by employers as part of a relocation. Pricing will be set with our first pilot customers.',
  },
  {
    q: 'Is this live today?',
    a: 'Parts of it. The privacy guard and data layer work and are tested; the government-service steps are a prototype. We are looking for a first company to pilot with.',
  },
];

/** An accordion where one answer opens at a time, with a measured height animation. */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="lp-faq">
      {questions.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className={`lp-faq-item ${isOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-${index}`}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              {item.q}
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3 }}
                aria-hidden="true"
              >
                <Plus size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-${index}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="lp-faq-answer"
                >
                  <p>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
