import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import './pitch.css';

export const metadata: Metadata = {
  title: 'Rasikh · Pitch',
  description: 'Rasikh: one plan for moving to Abu Dhabi, with a privacy guard on every step.',
};

export default function PitchLayout({ children }: { children: ReactNode }) {
  return children;
}
