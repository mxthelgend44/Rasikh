'use client';

import { useEffect, useState } from 'react';
import { Deck } from '@/components/pitch/deck';
import { PresenterView } from '@/components/pitch/presenter-view';

/**
 * The pitch route. Chooses between the audience deck and the notes window. The two are
 * siblings, never layered, so nothing from the notes is in the shared window's DOM. The query
 * is read in an effect because the route is prerendered.
 */
export default function PitchPage() {
  const [presenter, setPresenter] = useState(false);
  useEffect(() => {
    setPresenter(new URLSearchParams(window.location.search).get('presenter') === '1');
  }, []);
  return presenter ? <PresenterView /> : <Deck />;
}
