'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';
import { useReducedMotion } from '@/lib/motion';

/** A hairline at the top of the page that fills as you scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return <motion.div className="lp-scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

/** The hero photo, drifting slower than the page for depth. Static under reduced motion. */
export function ParallaxHeroImage({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '18%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, reduced ? 1.06 : 1.16]);
  return (
    <div ref={ref} className="lp-hero-media" aria-hidden="true">
      <motion.div className="lp-hero-parallax" style={{ y, scale }}>
        <Image src={src} alt="" fill priority sizes="100vw" className="lp-hero-image" />
      </motion.div>
    </div>
  );
}

/** Splits a headline into words that rise in sequence; `accent` words are set in italic. */
export function WordReveal({
  text,
  accent = [],
  delay = 0.15,
}: {
  text: string;
  accent?: string[];
  delay?: number;
}) {
  const words = text.split(' ');
  return (
    <span className="lp-words" aria-label={text}>
      {words.map((word, index) => {
        const bare = word.replace(/[.,]/g, '');
        return (
          <span key={`${word}-${index}`} className="lp-word" aria-hidden="true">
            <motion.span
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.9, delay: delay + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {accent.includes(bare) ? <em>{word}</em> : word}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
