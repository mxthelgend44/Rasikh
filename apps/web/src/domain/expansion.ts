import { unlockSteps } from './roadmap';
import type { Id, JurisdictionKind, SetupStep, SetupStepKey } from './types';

interface SetupSpec {
  key: SetupStepKey;
  title: string;
  dependsOn: SetupStepKey[];
  reasoning: string;
  /** TAMM service id from the mocked catalogue, or a resolver when it depends on the jurisdiction. */
  tammServiceId?: string | ((jurisdiction: JurisdictionKind) => string | undefined);
}

/** Licence service per jurisdiction. Hub71 is an ecosystem, not a catalogue service. */
const LICENSE_SERVICE: Partial<Record<JurisdictionKind, string>> = {
  mainland: 'svc_economic_license',
  adgm: 'svc_adgm_setup',
  kezad: 'svc_kezad_setup',
  masdar: 'svc_masdar_setup',
  twofour54: 'svc_twofour54_setup',
};

/**
 * Illustrative sequencing: the real order depends on the jurisdiction. The reasoning says so
 * where it matters, and nothing here states a fee, duration or legal requirement.
 */
const SETUP_SPECS: SetupSpec[] = [
  {
    key: 'trade_name',
    title: 'Reserve a trade name',
    dependsOn: [],
    reasoning: 'A licence application needs an approved trade name, so this goes first.',
    tammServiceId: 'svc_trade_name',
  },
  {
    key: 'license',
    title: 'Get your licence',
    dependsOn: ['trade_name'],
    reasoning:
      'The licence defines what the entity may do and where. The establishment card and visa quota follow it.',
    tammServiceId: (jurisdiction) => LICENSE_SERVICE[jurisdiction],
  },
  {
    key: 'office_lease',
    title: 'Secure an office',
    dependsOn: ['trade_name'],
    reasoning:
      'Most setups need a registered office address. The real order depends on your jurisdiction.',
  },
  {
    key: 'establishment_card',
    title: 'Establishment card',
    dependsOn: ['license'],
    reasoning: 'The establishment card is issued against the licence.',
    tammServiceId: 'svc_establishment_card',
  },
  {
    key: 'visa_quota',
    title: 'Visa quota',
    dependsOn: ['establishment_card'],
    reasoning:
      'Once the entity has a visa quota it can sponsor your team, and their relocation starts on its own.',
    tammServiceId: 'svc_visa_quota',
  },
  {
    key: 'entity_bank_account',
    title: 'Entity bank account',
    dependsOn: ['license', 'office_lease'],
    reasoning:
      'Banks usually ask for the licence and a registered address before opening an account.',
  },
];

export function buildSetupSteps(
  companyId: Id,
  jurisdiction: JurisdictionKind,
  stepId: (key: SetupStepKey) => Id,
): SetupStep[] {
  const steps = SETUP_SPECS.map(
    (spec, index): SetupStep => ({
      id: stepId(spec.key),
      companyId,
      key: spec.key,
      title: spec.title,
      order: index,
      dependsOn: spec.dependsOn,
      status: spec.dependsOn.length === 0 ? 'ready' : 'locked',
      reasoning: spec.reasoning,
      tammServiceId:
        typeof spec.tammServiceId === 'function'
          ? spec.tammServiceId(jurisdiction)
          : spec.tammServiceId,
    }),
  );
  return unlockSteps(steps);
}
