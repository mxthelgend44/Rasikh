'use client';

import { DEMO_FIXTURES } from '@rasikh/shared';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  Clock3,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Plus,
  Route,
  Sparkles,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import type {
  Company,
  JurisdictionKind,
  SetupRecommendation,
  SetupStep,
  SetupStepKey,
} from '@/domain/types';
import { stepsOf, hireStatus } from '@/domain/selectors';
import { formatAed } from '@/lib/format';
import { useAppState, useStore } from '@/store/provider';
import {
  ActivityList,
  EmployerHeader,
  Feedback,
  HireStatusBadge,
  Initials,
  inputClass,
  linkClass,
  Metric,
  Modal,
  Panel,
  Progress,
  setupArabic,
  StepBadge,
  useEmployerAction,
  useEmployerCopy,
} from './common';
import { EmployerScopePicker, useEmployerScope } from './scope';

const jurisdictionNames: Record<JurisdictionKind, string> = {
  mainland: 'Abu Dhabi mainland',
  adgm: 'ADGM',
  kezad: 'KEZAD',
  masdar: 'Masdar City',
  twofour54: 'twofour54',
  hub71: 'Hub71',
};
const setupReasonsArabic: Record<SetupStepKey, string> = {
  trade_name: 'يحتاج طلب الرخصة إلى اسم تجاري معتمد، لذا تأتي هذه الخطوة أولاً.',
  license: 'تحدد الرخصة أنشطة الشركة وموقعها. تتبعها بطاقة المنشأة وحصة التأشيرات.',
  office_lease:
    'تحتاج معظم مسارات التأسيس إلى عنوان مكتب مسجل. يعتمد الترتيب الفعلي على المسار المختار.',
  establishment_card: 'تصدر بطاقة المنشأة استناداً إلى الرخصة.',
  visa_quota: 'عند توفر حصة التأشيرات، يمكن للشركة كفالة الفريق وتبدأ خارطة انتقال كل عضو.',
  entity_bank_account: 'تطلب البنوك عادة الرخصة وعنواناً مسجلاً قبل فتح الحساب.',
};

function useExpansionCompany() {
  const state = useAppState();
  const scope = useEmployerScope();
  const companies = Object.values(state.companies)
    .filter((company) => company.employerId === scope.employerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const company = companies.find((item) => item.id === scope.companyId) ?? companies[0];
  return { state, ...scope, companies, company };
}

export function EmployerExpansion({ team = false }: { team?: boolean }) {
  const { state, companies, company, employerId, setCompanyId } = useExpansionCompany();
  const { e, locale, record } = useEmployerCopy();
  const [creating, setCreating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [review, setReview] = useState<SetupStep | null>(null);
  const [search, setSearch] = useState('');
  const action = useEmployerAction();
  const steps = Object.values(state.setupSteps)
    .filter((step) => step.companyId === company?.id)
    .sort((a, b) => a.order - b.order);
  const members = Object.values(state.teamMembers).filter(
    (member) => member.companyId === company?.id,
  );
  const visibleMembers = members.filter((member) =>
    [member.fullName, member.role, member.originCity, member.originCountry].some((value) =>
      value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    ),
  );
  const quota = steps.find((step) => step.key === 'visa_quota');
  const quotaReady = quota?.status === 'done';
  const companyActivity = Object.values(state.agentActions)
    .filter((entry) => entry.caseId === company?.id)
    .sort((a, b) => b.at.localeCompare(a.at));
  const current = steps.find((step) => step.status !== 'done');
  const done = steps.filter((step) => step.status === 'done').length;
  const pendingMembers = members.filter((member) => !member.hireId);
  return (
    <>
      <EmployerHeader
        eyebrow={e('Land the company. Welcome the team.', 'أسّس الشركة. رحّب بالفريق.')}
        title={
          team
            ? e('A shared move. Individual journeys.', 'انتقال جماعي. رحلات فردية.')
            : e('Your Abu Dhabi chapter', 'فصلك الجديد في أبوظبي')
        }
        description={
          team
            ? e(
                'Plan your team’s move and follow each person as company setup unlocks their relocation.',
                'خطط لانتقال فريقك وتابع كل فرد عندما يفتح تأسيس الشركة مسار انتقاله.',
              )
            : e(
                'An ordered company setup, connected to the people who will bring it to life.',
                'تأسيس شركة بخطوات مرتبة، مرتبط بالفريق الذي سيبني مستقبلها.',
              )
        }
        actions={
          <>
            <Button variant="secondary" icon={<Plus />} onClick={() => setCreating(true)}>
              {e('New expansion', 'توسع جديد')}
            </Button>
            {team && company && (
              <Button icon={<Users />} onClick={() => setAddingMember(true)}>
                {e('Add team member', 'إضافة عضو للفريق')}
              </Button>
            )}
          </>
        }
      />
      <div className="space-y-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EmployerScopePicker />
          {companies.length > 0 && (
            <label className="flex min-w-0 items-center gap-2 text-label">
              <span className="text-fg-tertiary">{e('Expansion', 'التوسع')}</span>
              <select
                aria-label={e('Expansion company', 'شركة التوسع')}
                value={company?.id ?? ''}
                onChange={(event) => setCompanyId(event.target.value)}
                className="h-9 max-w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3 text-label"
              >
                {companies.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!company ? (
          <section className="grid overflow-hidden rounded-[1.5rem] border border-edge bg-accent-soft md:grid-cols-2">
            <div className="self-center p-6 sm:p-8">
              <Badge tone="accent" shape="pill">
                {e('Company → people', 'الشركة ← الفريق')}
              </Badge>
              <h2 className="mt-4 text-[1.75rem] font-medium leading-tight">
                {e('Make room for your next chapter.', 'افتح الباب لفصلك القادم.')}
              </h2>
              <p className="mt-3 max-w-md text-body leading-6 text-fg-secondary">
                {e(
                  'Start with a company brief, choose a demo setup path and add the people who are moving.',
                  'ابدأ بتعريف الشركة، واختر مسار تأسيس تجريبياً وأضف الأشخاص المنتقلين.',
                )}
              </p>
              <Button size="lg" className="mt-5" icon={<Plus />} onClick={() => setCreating(true)}>
                {e('Create a company brief', 'إنشاء تعريف الشركة')}
              </Button>
            </div>
            <Illustration
              variant={team ? 'team-move' : 'company-setup'}
              decorative
              aspect="landscape"
              fit="contain"
              treatment="cutout"
              fade="none"
              sizes="(max-width: 767px) 100vw, 45vw"
              className="min-h-[240px] md:h-full"
            />
          </section>
        ) : (
          <>
            <section className="grid overflow-hidden rounded-[1.5rem] border border-accent/15 bg-accent-soft lg:grid-cols-[1.2fr_1fr]">
              <div className="self-center p-6 sm:p-8">
                <Badge tone="accent" shape="pill">
                  {e('Illustrative setup', 'تأسيس توضيحي')} ·{' '}
                  {company.recommendation?.recommended
                    ? jurisdictionNames[company.recommendation.recommended]
                    : e('Selected path', 'المسار المختار')}
                </Badge>
                <h2 className="mt-4 text-[1.65rem] font-medium leading-tight tracking-tight">
                  {company.name}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-body text-fg-secondary">
                  <Globe2 aria-hidden className="size-4" />
                  {company.homeCountry}
                  <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                  {e('Abu Dhabi', 'أبوظبي')}
                </p>
                <div className="mt-5 max-w-lg">
                  <Progress
                    done={done}
                    total={steps.length}
                    label={e('Company setup progress', 'تقدم تأسيس الشركة')}
                  />
                </div>
                <p className="mt-3 text-label leading-6 text-fg-secondary">
                  {quotaReady
                    ? e(
                        'The demo visa quota is complete. Team members now have their own relocation roadmaps.',
                        'حصة التأشيرات التجريبية مكتملة. أصبح لكل عضو في الفريق خارطة انتقال خاصة.',
                      )
                    : e(
                        'Once the visa quota is complete, each team member enters the hire pipeline with employer backing.',
                        'عند اكتمال حصة التأشيرات، يدخل كل عضو في مسار الموظفين بدعم صاحب العمل.',
                      )}
                </p>
                <Link
                  className="mt-4 inline-flex min-h-9 items-center gap-2 text-label font-medium text-accent"
                  href={team ? '/employer/expansion' : '/employer/expansion/team'}
                >
                  {team
                    ? e('Open company setup', 'فتح تأسيس الشركة')
                    : e('See the team move', 'عرض انتقال الفريق')}
                  <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                </Link>
              </div>
              <Illustration
                variant={team ? 'team-move' : 'company-setup'}
                decorative
                aspect="landscape"
                fit="contain"
                treatment="cutout"
                fade="none"
                sizes="(max-width: 1023px) 100vw, 45vw"
                className="min-h-[260px] lg:h-full"
              />
            </section>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric
                title={e('Setup steps completed', 'خطوات التأسيس المكتملة')}
                value={`${done} / ${steps.length}`}
                detail={
                  current
                    ? e(`Next: ${current.title}`, `التالي: ${setupArabic[current.key]}`)
                    : e('All demo setup steps complete', 'كل خطوات التأسيس التجريبي مكتملة')
                }
                icon={FileCheck2}
              />
              <Metric
                title={e('People ready to move', 'أشخاص يستعدون للانتقال')}
                value={pendingMembers.length}
                detail={e(
                  `${members.length} recorded of ${company.teamSize} planned`,
                  `${members.length} مسجلون من ${company.teamSize} مخطط لهم`,
                )}
                icon={Users}
                tone="warning"
              />
              <Metric
                title={e('Personal journeys started', 'رحلات فردية بدأت')}
                value={members.filter((member) => member.hireId).length}
                detail={e(
                  'Connected to the employer hire pipeline',
                  'مرتبطة بمسار موظفي صاحب العمل',
                )}
                icon={Route}
                tone="success"
              />
            </div>
            <Feedback action={action} />
            {team ? (
              <>
                {!quotaReady && (
                  <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-warning/20 bg-warning-soft p-5">
                    <div className="flex max-w-2xl items-start gap-3">
                      <Clock3 aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
                      <div>
                        <h2 className="text-body font-medium text-warning">
                          {e(
                            'One company milestone unlocks every person',
                            'إنجاز واحد للشركة يفتح رحلة كل فرد',
                          )}
                        </h2>
                        <p className="mt-1 text-label leading-6 text-warning">
                          {e(
                            'Team relocations begin when the company’s visa quota step is completed. Complete the unlocked setup steps to get there.',
                            'تبدأ رحلات الفريق عند اكتمال خطوة حصة التأشيرات. أكمل خطوات التأسيس المتاحة للوصول إليها.',
                          )}
                        </p>
                      </div>
                    </div>
                    <Link href="/employer/expansion" className={linkClass}>
                      {e('Review setup', 'مراجعة التأسيس')}
                    </Link>
                  </div>
                )}
                <Panel
                  title={e('The people in your next chapter', 'الأشخاص في فصلك القادم')}
                  description={e(
                    'Family needs follow each person into their own roadmap.',
                    'تنتقل احتياجات الأسرة مع كل موظف إلى خارطته الفردية.',
                  )}
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Plus />}
                      onClick={() => setAddingMember(true)}
                    >
                      {e('Add member', 'إضافة عضو')}
                    </Button>
                  }
                >
                  <div className="border-b border-line p-4">
                    <label className="block max-w-sm">
                      <span className="sr-only">{e('Search team', 'البحث في الفريق')}</span>
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={e(
                          'Search name, role or city',
                          'ابحث بالاسم أو الوظيفة أو المدينة',
                        )}
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[720px]">
                      <caption className="sr-only">
                        {e('Expansion team members', 'أعضاء فريق التوسع')}
                      </caption>
                      <thead>
                        <tr>
                          <Th>{e('Person', 'الموظف')}</Th>
                          <Th>{e('Moving from', 'ينتقل من')}</Th>
                          <Th>{e('Household', 'الأسرة')}</Th>
                          <Th>{e('Journey', 'الرحلة')}</Th>
                          <Th>
                            <span className="sr-only">{e('Open journey', 'فتح الرحلة')}</span>
                          </Th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleMembers.map((member) => {
                          const hire = member.hireId ? state.hires[member.hireId] : undefined;
                          return (
                            <Tr key={member.id} className="!h-20">
                              <Td>
                                <div className="flex items-center gap-3">
                                  <Initials name={member.fullName} />
                                  <div>
                                    <p className="font-medium">{member.fullName}</p>
                                    <p className="mt-1 text-caption text-fg-tertiary">
                                      {member.role}
                                    </p>
                                  </div>
                                </div>
                              </Td>
                              <Td>
                                <p className="text-label">{member.originCity}</p>
                                <p className="mt-1 text-caption text-fg-tertiary">
                                  {member.originCountry}
                                </p>
                              </Td>
                              <Td className="text-label">
                                {member.family.spouse || member.family.children
                                  ? e(
                                      `${1 + Number(member.family.spouse) + member.family.children} people`,
                                      `${1 + Number(member.family.spouse) + member.family.children} أشخاص`,
                                    )
                                  : e('Solo', 'بمفرده')}
                              </Td>
                              <Td>
                                {hire ? (
                                  <HireStatusBadge status={hireStatus(stepsOf(state, hire.id))} />
                                ) : (
                                  <Badge tone="warning" shape="pill">
                                    {e('Awaiting visa quota', 'بانتظار حصة التأشيرات')}
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                                {hire && (
                                  <Link
                                    href={`/employer/hires/${hire.id}`}
                                    className="inline-flex min-h-9 items-center gap-1.5 text-label font-medium text-accent"
                                  >
                                    {e('View journey', 'عرض الرحلة')}
                                    <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
                                  </Link>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  {!visibleMembers.length && (
                    <div className="p-8 text-center text-body text-fg-tertiary">
                      {members.length
                        ? e('No team members match this search.', 'لا توجد نتائج تطابق البحث.')
                        : e(
                            'Add the first person who is moving with your company.',
                            'أضف أول شخص سينتقل مع شركتك.',
                          )}
                    </div>
                  )}
                </Panel>
                <Panel title={e('Team planning notes', 'ملاحظات تخطيط الفريق')}>
                  <div className="grid gap-5 p-5 sm:grid-cols-3">
                    <div>
                      <h3 className="text-label font-medium">
                        {e('Planned team', 'الفريق المخطط')}
                      </h3>
                      <p className="mt-2 text-body text-fg-secondary">
                        {company.teamSize} {e('people', 'أشخاص')}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-label font-medium">{e('Timeline', 'الجدول الزمني')}</h3>
                      <p className="mt-2 text-body leading-6 text-fg-secondary">
                        {company.timeline}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-label font-medium">
                        {e('Est. monthly team salary', 'الرواتب الشهرية التقديرية للفريق')}
                      </h3>
                      <p className="mt-2 text-body text-fg-secondary">
                        {formatAed(
                          members.reduce((sum, member) => sum + member.estMonthlySalaryAed, 0),
                          locale,
                        )}
                      </p>
                    </div>
                  </div>
                </Panel>
              </>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
                <Panel
                  title={e('Company setup roadmap', 'خارطة تأسيس الشركة')}
                  description={e(
                    'Complete a demo task only after reviewing its dependencies and result.',
                    'أكمل المهمة التجريبية بعد مراجعة متطلباتها ونتيجتها.',
                  )}
                >
                  <ol className="divide-y divide-line">
                    {steps.map((step, index) => (
                      <li
                        key={step.id}
                        className={`p-5 ${current?.id === step.id ? 'bg-accent-soft/30' : ''}`}
                      >
                        <div className="flex gap-3">
                          <span
                            aria-hidden
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-caption font-medium ${step.status === 'done' ? 'bg-accent text-accent-fg' : step.status === 'locked' ? 'bg-track text-fg-tertiary' : 'border border-accent/30 bg-accent-soft text-accent'}`}
                          >
                            {step.status === 'done' ? (
                              <Check className="size-4" />
                            ) : step.status === 'locked' ? (
                              <LockKeyhole className="size-3.5" />
                            ) : (
                              index + 1
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-body font-medium">
                                {e(step.title, setupArabic[step.key])}
                              </h3>
                              <StepBadge status={step.status} />
                            </div>
                            <p className="mt-2 text-label leading-6 text-fg-secondary">
                              {e(step.reasoning, setupReasonsArabic[step.key])}
                            </p>
                            {step.status === 'locked' && (
                              <p className="mt-2 text-caption text-fg-tertiary">
                                {e('Unlocks after', 'تفتح بعد')}:{' '}
                                {step.dependsOn
                                  .map((key) =>
                                    e(
                                      steps.find((candidate) => candidate.key === key)?.title ??
                                        key,
                                      setupArabic[key],
                                    ),
                                  )
                                  .join(' · ')}
                              </p>
                            )}
                            {step.status !== 'locked' && step.status !== 'done' && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {step.status === 'ready' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={action.busy}
                                    onClick={() =>
                                      void action.run(
                                        {
                                          type: 'setup.set_status',
                                          employerId,
                                          stepId: step.id,
                                          status: 'in_progress',
                                        },
                                        e(
                                          'Demo setup task started.',
                                          'تم بدء مهمة التأسيس التجريبية.',
                                        ),
                                      )
                                    }
                                  >
                                    {e('Start demo task', 'بدء مهمة تجريبية')}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<FileCheck2 />}
                                  onClick={() => setReview(step)}
                                >
                                  {step.key === 'visa_quota'
                                    ? e(
                                        'Review & start team move · demo',
                                        'مراجعة وبدء انتقال الفريق · تجريبي',
                                      )
                                    : e('Review & complete · demo', 'مراجعة وإكمال · تجريبي')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Panel>
                <div className="space-y-6">
                  <Panel
                    title={e('Why this path?', 'لماذا هذا المسار؟')}
                    description={e(
                      'A saved demo recommendation for this company brief.',
                      'توصية تجريبية محفوظة بناءً على تعريف الشركة.',
                    )}
                  >
                    <div className="space-y-4 p-5">
                      {company.recommendation?.options.map((option) => (
                        <div key={option.kind} className="rounded-xl border border-edge p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-body font-medium">{option.label}</h3>
                            <Badge
                              tone={
                                option.kind === company.recommendation?.recommended
                                  ? 'accent'
                                  : 'neutral'
                              }
                              shape="pill"
                            >
                              {option.kind === company.recommendation?.recommended
                                ? e('Saved path', 'المسار المحفوظ')
                                : e('Alternative', 'بديل')}
                            </Badge>
                          </div>
                          <ul className="mt-3 space-y-2">
                            {option.reasons.map((reason) => (
                              <li key={reason} className="text-label leading-6 text-fg-secondary">
                                {record(reason)}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-caption leading-5 text-fg-tertiary">
                            {option.tradeoffs.map(record).join(' ')}
                          </p>
                        </div>
                      ))}
                      <p className="text-caption leading-6 text-fg-tertiary">
                        {record(
                          company.recommendation?.disclaimer ??
                            'Illustrative demo guidance. Confirm the setup route and requirements with the relevant authority.',
                        )}
                      </p>
                      <p className="text-caption leading-6 text-fg-tertiary">
                        {e(
                          'Hub71 is an ecosystem programme, not a licensing jurisdiction.',
                          'هب71 برنامج منظومة أعمال، وليس جهة ترخيص.',
                        )}
                      </p>
                    </div>
                  </Panel>
                  <Panel title={e('Your company brief', 'تعريف شركتك')}>
                    <dl className="space-y-4 p-5">
                      <div>
                        <dt className="text-caption text-fg-tertiary">{e('Industry', 'القطاع')}</dt>
                        <dd className="mt-1 text-body">{company.industry}</dd>
                      </div>
                      <div>
                        <dt className="text-caption text-fg-tertiary">
                          {e('Planned activities', 'الأنشطة المخطط لها')}
                        </dt>
                        <dd className="mt-1 text-body leading-6">
                          {company.activities.join(' · ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption text-fg-tertiary">
                          {e('Timeline', 'الجدول الزمني')}
                        </dt>
                        <dd className="mt-1 text-body leading-6">{company.timeline}</dd>
                      </div>
                    </dl>
                  </Panel>
                </div>
              </div>
            )}
            <Panel
              title={e('Recorded company activity', 'نشاط الشركة المسجل')}
              description={e(
                'Demo setup changes and team handoffs, recorded as they happen.',
                'تغييرات التأسيس وتسليم مهام الفريق في العرض التجريبي.',
              )}
            >
              <ActivityList entries={companyActivity.slice(0, 5)} />
            </Panel>
            <p className="text-caption leading-6 text-fg-tertiary">
              {e(
                'All actions update the shared demo only. No licence, visa or bank application is submitted to an external service.',
                'تحدّث جميع الإجراءات العرض التجريبي المشترك فقط. لا يتم تقديم طلبات رخصة أو تأشيرة أو حساب مصرفي إلى جهة خارجية.',
              )}
            </p>
          </>
        )}
      </div>
      {creating && (
        <CompanyDialog
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCompanyId(id);
            setCreating(false);
          }}
        />
      )}
      {addingMember && company && (
        <TeamMemberDialog company={company} onClose={() => setAddingMember(false)} />
      )}
      {review && company && (
        <SetupReviewDialog company={company} step={review} onClose={() => setReview(null)} />
      )}
    </>
  );
}

function SetupReviewDialog({
  company,
  step,
  onClose,
}: {
  company: Company;
  step: SetupStep;
  onClose: () => void;
}) {
  const { e } = useEmployerCopy();
  const { employerId } = useEmployerScope();
  const state = useAppState();
  const [confirmed, setConfirmed] = useState(false);
  const action = useEmployerAction();
  const members = Object.values(state.teamMembers).filter(
    (member) => member.companyId === company.id && !member.hireId,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) return;
    const ok = await action.run(
      { type: 'setup.set_status', stepId: step.id, employerId, status: 'done' },
      e('Demo setup completion recorded.', 'تم تسجيل اكتمال التأسيس التجريبي.'),
    );
    if (ok) onClose();
  }
  return (
    <Modal
      title={e('Review before completing', 'راجع قبل الإكمال')}
      description={e(step.title, setupArabic[step.key])}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <fieldset disabled={action.busy} className="space-y-5">
          <div className="rounded-xl bg-accent-soft p-4">
            <p className="text-body font-medium text-accent">{company.name}</p>
            <p className="mt-2 text-label leading-6 text-fg-secondary">
              {e(
                'This records illustrative progress in the demo. It does not confirm a government decision or submit an application.',
                'يسجل هذا تقدماً توضيحياً في العرض التجريبي. ولا يؤكد قراراً حكومياً أو يقدم طلباً.',
              )}
            </p>
          </div>
          {step.key === 'visa_quota' && (
            <div className="rounded-xl border border-warning/25 bg-warning-soft p-4">
              <p className="text-body font-medium text-warning">
                {e(
                  `${members.length} people will enter the hire pipeline`,
                  `سينضم ${members.length} أشخاص إلى مسار الموظفين`,
                )}
              </p>
              <p className="mt-2 text-label leading-6 text-warning">
                {e(
                  'Each person gets their own roadmap, family steps where applicable, and employer backing. This happens immediately in the shared demo.',
                  'يحصل كل فرد على خارطة خاصة، وخطوات الأسرة عند الحاجة، ودعم صاحب العمل. يحدث هذا فوراً في العرض التجريبي المشترك.',
                )}
              </p>
              <ul className="mt-3 space-y-1 text-label text-warning">
                {members.map((member) => (
                  <li key={member.id}>
                    {member.fullName} · {member.role}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label className="flex items-start gap-3 rounded-xl border border-edge p-4">
            <input
              required
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 size-4 accent-accent"
            />
            <span className="text-body leading-6">
              {e(
                'I have reviewed the demo result and want to record this step as complete.',
                'راجعت النتيجة التجريبية وأريد تسجيل هذه الخطوة كمكتملة.',
              )}
            </span>
          </label>
          <Feedback action={action} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {e('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" disabled={!confirmed || action.busy} icon={<Check />}>
              {step.key === 'visa_quota'
                ? e('Complete & move team · demo', 'إكمال وانتقال الفريق · تجريبي')
                : e('Record demo completion', 'تسجيل الاكتمال التجريبي')}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function CompanyDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { e } = useEmployerCopy();
  const { employerId } = useEmployerScope();
  const store = useStore();
  const action = useEmployerAction();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [activities, setActivities] = useState('');
  const [teamSize, setTeamSize] = useState('3');
  const [timeline, setTimeline] = useState('');
  const [kind, setKind] = useState<JurisdictionKind>('adgm');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Object.hasOwn(store.getSnapshot().state.companies, DEMO_FIXTURES.company)
      ? `company_${crypto.randomUUID()}`
      : DEMO_FIXTURES.company;
    const recommendation: SetupRecommendation = {
      generatedBy: 'demo',
      recommended: kind,
      disclaimer:
        'Illustrative demo guidance. Confirm the setup route and requirements with the relevant authority.',
      options: [
        {
          kind,
          label: jurisdictionNames[kind],
          fit: 'possible',
          reasons: ['The employer selected this path for the company brief in the demo.'],
          tradeoffs: [
            'Activities, eligibility, requirements and timing have not been confirmed with an authority.',
          ],
        },
      ],
    };
    const ok = await action.run(
      {
        type: 'company.create',
        id,
        company: {
          employerId,
          name: name.trim(),
          homeCountry: country.trim(),
          industry: industry.trim(),
          activities: activities
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          teamSize: Number(teamSize),
          timeline: timeline.trim(),
        },
        jurisdiction: kind,
        recommendation,
        team: [],
      },
      e(
        'Company brief and demo setup roadmap created.',
        'تم إنشاء تعريف الشركة وخارطة التأسيس التجريبية.',
      ),
    );
    if (ok && store.getSnapshot().state.companies[id]) onCreated(id);
  }
  return (
    <Modal
      title={e('Start with the company', 'ابدأ بالشركة')}
      description={e(
        'Create a brief and select a demo setup path. Add your team next.',
        'أنشئ تعريفاً للشركة واختر مسار تأسيس تجريبياً، ثم أضف فريقك.',
      )}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <fieldset disabled={action.busy} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent-soft p-3">
            <p className="text-label text-accent">
              {e(
                'Illustrative setup. Requirements need confirmation.',
                'تأسيس توضيحي. يلزم التحقق من المتطلبات.',
              )}
            </p>
            <Button
              size="sm"
              variant="ghost"
              icon={<Sparkles />}
              onClick={() => {
                setName('Northstar Analytics Abu Dhabi');
                setCountry('United Kingdom');
                setIndustry('Data analytics');
                setActivities('Enterprise software, Data analytics');
                setTimeline('First team moving this quarter');
              }}
            >
              {e('Use sample', 'استخدم مثالاً')}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-label font-medium">
                {e('Company name', 'اسم الشركة')}
              </span>
              <input
                required
                maxLength={180}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-label font-medium">
                {e('Home country', 'بلد المقر الأصلي')}
              </span>
              <input
                required
                maxLength={100}
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-label font-medium">{e('Industry', 'القطاع')}</span>
              <input
                required
                maxLength={100}
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-label font-medium">
                {e('Planned activities · comma separated', 'الأنشطة المخطط لها · مفصولة بفواصل')}
              </span>
              <input
                required
                maxLength={500}
                value={activities}
                onChange={(event) => setActivities(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-label font-medium">
                {e('Planned team size', 'حجم الفريق المخطط')}
              </span>
              <input
                required
                type="number"
                min={1}
                max={500}
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-label font-medium">
                {e('Planned timing', 'التوقيت المخطط')}
              </span>
              <input
                required
                maxLength={180}
                value={timeline}
                onChange={(event) => setTimeline(event.target.value)}
                placeholder={e('First team moving this quarter', 'انتقال أول فريق هذا الربع')}
                className={inputClass}
              />
            </label>
          </div>
          <fieldset>
            <legend className="mb-3 text-label font-medium">
              {e('Choose a demo setup path', 'اختر مسار تأسيس تجريبياً')}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['mainland', 'adgm', 'kezad', 'masdar', 'twofour54'] as JurisdictionKind[]).map(
                (option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${kind === option ? 'border-accent bg-accent-soft' : 'border-edge'}`}
                  >
                    <input
                      type="radio"
                      name="jurisdiction"
                      value={option}
                      checked={kind === option}
                      onChange={() => setKind(option)}
                      className="size-4 accent-accent"
                    />
                    <span className="text-body font-medium">{jurisdictionNames[option]}</span>
                  </label>
                ),
              )}
            </div>
            <p className="mt-3 text-caption leading-6 text-fg-tertiary">
              {e(
                'Hub71 is an ecosystem programme. A licensing jurisdiction is chosen separately. This selection is a demo input, not a verified recommendation.',
                'هب71 برنامج منظومة أعمال، ويُختار مسار الترخيص بشكل مستقل. هذا الاختيار مدخل تجريبي، وليس توصية مؤكدة.',
              )}
            </p>
          </fieldset>
          <Feedback action={action} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {e('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" disabled={action.busy} icon={<Building2 />}>
              {e('Create setup roadmap', 'إنشاء خارطة التأسيس')}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

function TeamMemberDialog({ company, onClose }: { company: Company; onClose: () => void }) {
  const { e } = useEmployerCopy();
  const { employerId } = useEmployerScope();
  const action = useEmployerAction();
  const [fields, setFields] = useState({
    fullName: '',
    nationality: '',
    role: '',
    originCity: '',
    originCountry: '',
    salary: '',
    children: '0',
    spouse: false,
  });
  const field = (key: keyof typeof fields, value: string | boolean) =>
    setFields((previous) => ({ ...previous, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await action.run(
      {
        type: 'team.add',
        companyId: company.id,
        employerId,
        member: {
          fullName: fields.fullName.trim(),
          nationality: fields.nationality.trim(),
          role: fields.role.trim(),
          originCity: fields.originCity.trim(),
          originCountry: fields.originCountry.trim(),
          estMonthlySalaryAed: Number(fields.salary),
          family: { spouse: fields.spouse, children: Number(fields.children) },
        },
      },
      e('Team member added to the shared expansion.', 'تمت إضافة عضو الفريق إلى التوسع المشترك.'),
    );
    if (ok) onClose();
  }
  return (
    <Modal
      title={e('Welcome another person to the plan', 'أضف شخصاً آخر إلى الخطة')}
      description={company.name}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <fieldset disabled={action.busy} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent-soft p-3">
            <p className="text-label leading-5 text-accent">
              {e(
                'Their journey starts when the visa quota is complete.',
                'تبدأ رحلة انتقاله عند اكتمال حصة التأشيرات.',
              )}
            </p>
            <Button
              size="sm"
              variant="ghost"
              icon={<Sparkles />}
              onClick={() =>
                setFields({
                  fullName: 'Sofia Laurent',
                  nationality: 'French',
                  role: 'Product lead',
                  originCity: 'Paris',
                  originCountry: 'France',
                  salary: '29000',
                  children: '1',
                  spouse: true,
                })
              }
            >
              {e('Use sample', 'استخدم مثالاً')}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { key: 'fullName', label: e('Full name', 'الاسم الكامل') },
                { key: 'role', label: e('Role', 'الوظيفة') },
                { key: 'nationality', label: e('Nationality', 'الجنسية') },
                { key: 'originCity', label: e('Origin city', 'مدينة المنشأ') },
                { key: 'originCountry', label: e('Country', 'البلد') },
                {
                  key: 'salary',
                  label: e('Est. monthly salary (AED)', 'الراتب الشهري التقديري (درهم)'),
                },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="space-y-1.5">
                <span className="block text-label font-medium">{label}</span>
                <input
                  required
                  type={key === 'salary' ? 'number' : 'text'}
                  min={key === 'salary' ? 1 : undefined}
                  maxLength={160}
                  value={fields[key]}
                  onChange={(event) => field(key, event.target.value)}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-5 rounded-xl border border-edge p-4">
            <label className="flex items-center gap-2 text-body">
              <input
                type="checkbox"
                checked={fields.spouse}
                onChange={(event) => field('spouse', event.target.checked)}
                className="size-4 accent-accent"
              />
              {e('Spouse moving too', 'الزوج أو الزوجة ينتقل أيضاً')}
            </label>
            <label className="flex items-center gap-3 text-body">
              {e('Children', 'الأطفال')}
              <input
                required
                type="number"
                min={0}
                max={12}
                value={fields.children}
                onChange={(event) => field('children', event.target.value)}
                className={`${inputClass} !w-20`}
              />
            </label>
          </div>
          <Feedback action={action} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {e('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" disabled={action.busy} icon={<Plus />}>
              {e('Add to team', 'إضافة إلى الفريق')}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
