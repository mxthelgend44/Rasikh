import { readFileSync } from 'node:fs';
import type { RoadmapFixture } from '../types.ts';

// Checked-in golden decisions are independent of the implementation under test.
// Updating this file requires reviewing the intended graph behavior.
export const roadmapFixtures: RoadmapFixture[] = JSON.parse(
  readFileSync(new URL('./roadmaps.json', import.meta.url), 'utf8'),
);
