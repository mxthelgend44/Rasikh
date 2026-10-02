import type { ComponentType } from 'react';
import {
  BuiltSlide,
  ClosingSlide,
  CustomerSlide,
  ModelSlide,
  RoadmapSlide,
  SecuritySlide,
  ValueSlide,
  WhySlide,
} from './slides/proof';
import {
  ExpansionSlide,
  GuardMomentSlide,
  IntroducingSlide,
  PassportSlide,
  ServicesSlide,
  SolutionSlide,
  SystemSlide,
} from './slides/product';
import { GapSlide, PathwaySlide, ProblemSlide, ScenarioSlide, TitleSlide } from './slides/story';

/** Deck order. Presenter notes in presenter-notes.ts follow the same indexes. */
export const rasikhSlides: ComponentType[] = [
  TitleSlide,
  ScenarioSlide,
  PathwaySlide,
  GapSlide,
  ProblemSlide,
  IntroducingSlide,
  SolutionSlide,
  SystemSlide,
  GuardMomentSlide,
  PassportSlide,
  ServicesSlide,
  ExpansionSlide,
  SecuritySlide,
  WhySlide,
  BuiltSlide,
  ValueSlide,
  CustomerSlide,
  ModelSlide,
  RoadmapSlide,
  ClosingSlide,
];
