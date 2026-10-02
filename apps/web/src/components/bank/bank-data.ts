import { DATA_LABELS, type DataLabel } from '@rasikh/shared';
import { policyFor } from '@/domain/policy';
import type {
  Application,
  AppState,
  DocumentKind,
  Locale,
  RelocationDocument,
} from '@/domain/types';

export const BANK_ID = 'bank_saadiyat';
export const OPEN_STATES: Application['state'][] = ['submitted', 'under_review', 'needs_info'];

export function bankApplications(state: AppState) {
  return Object.values(state.applications)
    .filter(
      (application) =>
        application.kind === 'bank_account' &&
        application.partyId === BANK_ID &&
        application.state !== 'awaiting_approval',
    )
    .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
}

function bankDisclosureAccess(state: AppState, application: Application, label: DataLabel) {
  if (
    application.kind !== 'bank_account' ||
    application.partyId !== BANK_ID ||
    application.state === 'awaiting_approval' ||
    !DATA_LABELS.includes(label)
  )
    return false;
  if (!application.disclosed.some((item) => item.label === label)) return false;
  const check = latestBankCheck(state, application.hireId);
  if (
    check &&
    check.decision !== 'allow' &&
    (!check.blockedLabels.length || check.blockedLabels.includes(label))
  )
    return false;
  const policy = policyFor(label, 'bank');
  if (policy === 'allow') return true;
  if (policy !== 'consent') return false;
  return Object.values(state.grants).some(
    (grant) =>
      grant.hireId === application.hireId && grant.destination === 'bank' && grant.label === label,
  );
}

export function labelAccess(state: AppState, application: Application, label: DataLabel) {
  return (
    application.disclosed.some((item) => item.label === label && !item.derived) &&
    bankDisclosureAccess(state, application, label)
  );
}

const DOCUMENT_LABELS: Record<DocumentKind, DataLabel[]> = {
  passport: ['passport'],
  offer_letter: ['employment', 'salary'],
  residence_visa: ['passport'],
  emirates_id: ['emirates_id'],
  tenancy_contract: ['address'],
  salary_certificate: ['salary'],
  bank_statement: ['bank_statement'],
  degree: ['degree'],
};

export function documentAccess(
  state: AppState,
  application: Application,
  document: RelocationDocument,
) {
  const required = DOCUMENT_LABELS[document.kind];
  return (
    document.hireId === application.hireId &&
    Boolean(required) &&
    document.labels.length > 0 &&
    document.labels.every((label) => DATA_LABELS.includes(label)) &&
    required.every((label) => document.labels.includes(label)) &&
    [...new Set([...required, ...document.labels])].every((label) =>
      labelAccess(state, application, label),
    )
  );
}

export function consentGaps(state: AppState, application: Application) {
  return application.disclosed.filter(
    (item) => !bankDisclosureAccess(state, application, item.label),
  );
}

export function latestBankCheck(state: AppState, hireId: string) {
  return Object.values(state.guardChecks)
    .filter((check) => check.caseId === hireId && check.destination === 'bank')
    .reverse()
    .sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function latestDecision(state: AppState, applicationId: string) {
  return Object.values(state.decisions)
    .filter((decision) => decision.applicationId === applicationId)
    .reverse()
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0];
}

export const bankText = (locale: Locale, en: string, ar: string) => (locale === 'ar' ? ar : en);

export function applicationLabel(status: Application['state'], locale: Locale) {
  const labels: Record<Application['state'], [string, string]> = {
    awaiting_approval: ['Awaiting permission', 'بانتظار الإذن'],
    submitted: ['New application', 'طلب جديد'],
    under_review: ['In review', 'قيد المراجعة'],
    needs_info: ['Information requested', 'معلومات مطلوبة'],
    terms_offered: ['Terms offered', 'شروط مقترحة'],
    approved: ['Approved', 'معتمد'],
    declined: ['Declined', 'مرفوض'],
  };
  return labels[status][locale === 'ar' ? 1 : 0];
}

export function applicationTone(status: Application['state']) {
  if (status === 'approved') return 'success' as const;
  if (status === 'declined') return 'danger' as const;
  if (status === 'needs_info' || status === 'awaiting_approval') return 'warning' as const;
  if (status === 'under_review' || status === 'submitted') return 'accent' as const;
  return 'neutral' as const;
}

export function dataLabel(label: DataLabel, locale: Locale) {
  const labels: Record<DataLabel, [string, string]> = {
    passport: ['Passport', 'جواز السفر'],
    emirates_id: ['Emirates ID', 'الهوية الإماراتية'],
    salary: ['Salary', 'الراتب'],
    employment: ['Employment', 'التوظيف'],
    address: ['Address', 'العنوان'],
    bank_statement: ['Bank statement', 'كشف الحساب'],
    family: ['Family', 'الأسرة'],
    degree: ['Degree', 'الشهادة الأكاديمية'],
    health: ['Health', 'الصحة'],
  };
  return labels[label][locale === 'ar' ? 1 : 0];
}

export function documentLabel(kind: DocumentKind, locale: Locale) {
  const labels: Record<DocumentKind, [string, string]> = {
    passport: ['Passport', 'جواز السفر'],
    offer_letter: ['Signed offer letter', 'عرض عمل موقّع'],
    residence_visa: ['Residence visa', 'تأشيرة الإقامة'],
    emirates_id: ['Emirates ID', 'الهوية الإماراتية'],
    salary_certificate: ['Salary certificate', 'شهادة الراتب'],
    bank_statement: ['Bank statement', 'كشف الحساب'],
    tenancy_contract: ['Tenancy contract', 'عقد الإيجار'],
    degree: ['Degree', 'الشهادة الأكاديمية'],
  };
  return labels[kind][locale === 'ar' ? 1 : 0];
}

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}
