export type IllustrationVariant =
  | 'arrival'
  | 'journey'
  | 'documents'
  | 'neighborhood-reem'
  | 'neighborhood-raha'
  | 'neighborhood-khalifa'
  | 'neighborhood-yas'
  | 'neighborhood-saadiyat'
  | 'neighborhood-maryah'
  | 'finding-home'
  | 'banking'
  | 'privacy-consent'
  | 'welcoming-hire'
  | 'company-setup'
  | 'team-move'
  | 'family-relocation'
  | 'fully-settled'
  | 'empty-hires'
  | 'empty-properties'
  | 'empty-bank-applications';

export interface IllustrationAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
  fit: 'cover' | 'contain';
  position: string;
  cutout?: boolean;
  silhouette?: 'company';
}

export const ILLUSTRATION_ASSETS: Record<IllustrationVariant, IllustrationAsset> = {
  arrival: {
    src: '/illustrations/v1/arrival.png',
    width: 1536,
    height: 1024,
    alt: 'Illustrated traveler entering an Abu Dhabi waterfront through an arch.',
    fit: 'cover',
    position: '65% 50%',
  },
  journey: {
    src: '/illustrations/v1/journey.png',
    width: 1448,
    height: 1086,
    alt: 'Four illustrated scenes connect document preparation, arrival, a home and settled life.',
    fit: 'cover',
    position: '50% 50%',
  },
  documents: {
    src: '/illustrations/v1/documents.png',
    width: 1254,
    height: 1254,
    alt: 'A professional organizes blank papers into a folder.',
    fit: 'contain',
    position: '50% 50%',
  },
  'neighborhood-reem': {
    src: '/illustrations/v1/neighborhood-reem.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated waterfront apartment towers and promenade on Al Reem Island.',
    fit: 'cover',
    position: '50% 50%',
  },
  'neighborhood-raha': {
    src: '/illustrations/v1/neighborhood-raha.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated waterfront residences and promenade at Al Raha Beach.',
    fit: 'cover',
    position: '50% 50%',
  },
  'neighborhood-khalifa': {
    src: '/illustrations/v1/neighborhood-khalifa.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated low-rise villas, gardens and shaded streets in Khalifa City.',
    fit: 'cover',
    position: '50% 50%',
  },
  'neighborhood-yas': {
    src: '/illustrations/v1/neighborhood-yas.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated marina, residences and leisure surroundings on Yas Island.',
    fit: 'cover',
    position: '50% 50%',
  },
  'neighborhood-saadiyat': {
    src: '/illustrations/v1/neighborhood-saadiyat.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated coastal homes, beach and cultural surroundings on Saadiyat Island.',
    fit: 'cover',
    position: '50% 50%',
  },
  'neighborhood-maryah': {
    src: '/illustrations/v1/neighborhood-maryah.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated modern towers and waterfront promenade on Al Maryah Island.',
    fit: 'cover',
    position: '50% 50%',
  },
  'finding-home': {
    src: '/illustrations/v1/finding-home.png',
    width: 1448,
    height: 1086,
    alt: 'An illustrated newcomer receives an apartment key at an open doorway.',
    fit: 'cover',
    position: '50% 50%',
  },
  banking: {
    src: '/illustrations/v1/banking.png',
    width: 1254,
    height: 1254,
    alt: 'An illustrated newcomer meets a bank representative at a welcoming desk.',
    fit: 'cover',
    position: '50% 50%',
  },
  'privacy-consent': {
    src: '/illustrations/v2-cutouts/privacy-consent.png',
    width: 1448,
    height: 1086,
    alt: 'A woman retains her private papers while sharing only an approved signal through a gate.',
    fit: 'contain',
    position: '50% 50%',
    cutout: true,
  },
  'welcoming-hire': {
    src: '/illustrations/v2-cutouts/welcoming-hire.png',
    width: 1448,
    height: 1086,
    alt: 'An illustrated HR colleague welcomes a traveler into a workplace.',
    fit: 'contain',
    position: '50% 50%',
    cutout: true,
  },
  'company-setup': {
    src: '/illustrations/v2-cutouts/company-setup.png',
    width: 1536,
    height: 1024,
    alt: 'Illustrated founders coordinate paperwork, an office and an arriving team.',
    fit: 'contain',
    position: '50% 50%',
    cutout: true,
    silhouette: 'company',
  },
  'team-move': {
    src: '/illustrations/v2-cutouts/team-move.png',
    width: 1448,
    height: 1086,
    alt: 'Illustrated colleagues arrive along paths meeting at an office doorway.',
    fit: 'contain',
    position: '50% 50%',
    cutout: true,
  },
  'family-relocation': {
    src: '/illustrations/v1/family-relocation.png',
    width: 1448,
    height: 1086,
    alt: 'An illustrated family settles into a neighborhood with moving boxes and school bags.',
    fit: 'cover',
    position: '50% 50%',
  },
  'fully-settled': {
    src: '/illustrations/v1/fully-settled.png',
    width: 1448,
    height: 1086,
    alt: 'An illustrated newcomer relaxes on a balcony with a neatly stored suitcase.',
    fit: 'cover',
    position: '50% 50%',
  },
  'empty-hires': {
    src: '/illustrations/v1/empty-hires.png',
    width: 1254,
    height: 1254,
    alt: 'A coordinator stands beside a welcoming vacant office desk.',
    fit: 'contain',
    position: '50% 50%',
  },
  'empty-properties': {
    src: '/illustrations/v1/empty-properties.png',
    width: 1254,
    height: 1254,
    alt: 'A property manager holds a key beside an apartment building model.',
    fit: 'contain',
    position: '50% 50%',
  },
  'empty-bank-applications': {
    src: '/illustrations/v1/empty-bank-applications.png',
    width: 1254,
    height: 1254,
    alt: 'A bank officer waits beside a blank application folder and an empty tray.',
    fit: 'contain',
    position: '50% 50%',
  },
};
