/** Chrome strings of the presenter guide. Step content itself lives in config/tour.ts. */

export interface TourCopy {
  guide: string;
  presenterGuide: string;
  next: string;
  back: string;
  finish: string;
  endTour: string;
  collapse: string;
  expand: string;
  stepOf: (n: number, total: number) => string;
  thisStep: string;
  runningTotal: string;
  seconds: (n: number) => string;
  overBudget: string;
  openThisView: string;
  newWindow: string;
  say: string;
  show: string;
  beStraight: string;
  demoStory: string;
  fullTour: string;
  trackLabel: string;
  allSteps: string;
  noSteps: string;
  keysHint: string;
  progress: string;
  featuresLabel: string;
}

const EN: TourCopy = {
  guide: 'Guide',
  presenterGuide: 'Presenter guide',
  next: 'Next',
  back: 'Back',
  finish: 'Finish',
  endTour: 'End tour',
  collapse: 'Collapse guide',
  expand: 'Expand guide',
  stepOf: (n, total) => `Step ${n} of ${total}`,
  thisStep: 'This step',
  runningTotal: 'Running total',
  seconds: (n) => `${n} s`,
  overBudget: 'Over the 3 minute budget',
  openThisView: 'Open this view',
  newWindow: 'New window',
  say: 'Say',
  show: 'Show',
  beStraight: 'Be straight about this',
  demoStory: 'Demo story',
  fullTour: 'Full feature tour',
  trackLabel: 'Tour track',
  allSteps: 'All steps',
  noSteps: 'There are no steps in this tour yet.',
  keysHint: 'Arrow keys move between steps. G opens or closes the guide.',
  progress: 'Tour progress',
  featuresLabel: 'Features shown',
};

const AR: TourCopy = {
  guide: 'الدليل',
  presenterGuide: 'دليل المقدّم',
  next: 'التالي',
  back: 'السابق',
  finish: 'إنهاء',
  endTour: 'إنهاء الجولة',
  collapse: 'طيّ الدليل',
  expand: 'توسيع الدليل',
  stepOf: (n, total) => `الخطوة ${n} من ${total}`,
  thisStep: 'هذه الخطوة',
  runningTotal: 'المجموع التراكمي',
  seconds: (n) => `${n} ث`,
  overBudget: 'تجاوز ميزانية الدقائق الثلاث',
  openThisView: 'افتح هذه الصفحة',
  newWindow: 'نافذة جديدة',
  say: 'قل',
  show: 'اعرض',
  beStraight: 'كن صريحاً بشأن هذا',
  demoStory: 'قصة العرض',
  fullTour: 'جولة المزايا الكاملة',
  trackLabel: 'مسار الجولة',
  allSteps: 'كل الخطوات',
  noSteps: 'لا توجد خطوات في هذه الجولة بعد.',
  keysHint: 'مفاتيح الأسهم تنقلك بين الخطوات. المفتاح G يفتح الدليل أو يغلقه.',
  progress: 'تقدّم الجولة',
  featuresLabel: 'المزايا المعروضة',
};

export function tourCopy(lang: string): TourCopy {
  return lang.toLowerCase().startsWith('ar') ? AR : EN;
}
