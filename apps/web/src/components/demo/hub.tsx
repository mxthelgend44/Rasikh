'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowRight,
  Building2,
  Compass,
  ExternalLink,
  FileClock,
  KeyRound,
  Landmark,
  Play,
  RotateCcw,
  ScrollText,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/shell/brand-mark';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Illustration } from '@/components/ui/illustration';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n/provider';
import { useConnection } from '@/store/provider';
import { useHub, type HubPerson } from './hub-data';

type Copy = (en: string, ar: string) => string;

/** Restrained load-in: short, eased, and only when the visitor has not asked for less motion. */
const HUB_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .hub-rise {
    animation: hub-rise 420ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
    animation-delay: calc(var(--hub-i, 0) * 70ms);
  }
  @keyframes hub-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
}
`;

const rise = (index: number): CSSProperties => ({ '--hub-i': index }) as CSSProperties;

/** The sand and seafoam brand fills. Dark theme swaps sand for the dark accent tint. */
const SAND = 'bg-[rgb(var(--brand-sand))] dark:bg-accent-soft';
const SAND_SOFT = 'bg-[rgb(var(--brand-sand)/0.5)] dark:bg-subtle';

/** Stretched link: the whole card is the target, with the focus ring drawn around the card. */
const STRETCH =
  "focus-visible:shadow-none focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:shadow-[0_0_0_2px_rgb(var(--surface)),0_0_0_4px_rgb(var(--focus))]";

const LINK_BUTTON =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-body font-medium transition-colors';

function Header() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === 'ar' ? 'en' : 'ar';
  return (
    <header className="hub-rise mx-auto flex h-16 w-full max-w-[75rem] items-center gap-2 px-4 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-md text-title font-medium text-fg"
      >
        <BrandMark className="size-7" />
        {t('app.name')}
      </Link>
      <span aria-hidden className="mx-1 hidden h-4 w-px bg-line-strong sm:block" />
      <span className="hidden text-body text-fg-tertiary sm:block">
        {locale === 'ar' ? 'مركز العرض التجريبي' : 'Demo hub'}
      </span>
      <div className="flex-1" />
      <Button
        variant="ghost"
        aria-label={t('common.language')}
        lang={next}
        onClick={() => setLocale(next)}
      >
        {next === 'ar' ? 'العربية' : 'English'}
      </Button>
      <ThemeToggle
        label={(to) => t(to === 'dark' ? 'common.theme.toDark' : 'common.theme.toLight')}
      />
    </header>
  );
}

function Hero({ l }: { l: Copy }) {
  return (
    <section
      aria-labelledby="hub-title"
      className={cn(
        'overflow-hidden rounded-xl lg:grid lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]',
        SAND,
      )}
    >
      <div className="flex flex-col justify-center gap-6 px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
        <p className="hub-rise text-label font-medium text-accent" style={rise(1)}>
          {l(
            'Relocation to Abu Dhabi, on one live record',
            'الانتقال إلى أبوظبي على سجل واحد مباشر',
          )}
        </p>
        <h1
          id="hub-title"
          className="hub-rise text-balance text-[2rem] font-medium leading-[1.15] text-fg sm:text-[2.5rem]"
          style={rise(2)}
        >
          {l(
            'A new life in Abu Dhabi, one approved step at a time.',
            'حياة جديدة في أبوظبي، بخطوة واحدة موافَق عليها في كل مرة.',
          )}
        </h1>
        <p className="hub-rise max-w-[34rem] text-title text-fg-secondary" style={rise(3)}>
          {l(
            'Rasikh keeps the newcomer, their employer, a landlord and a bank on the same record. An AI agent does the paperwork and asks before it sends anything.',
            'يجمع راسخ القادم الجديد وصاحب العمل والمؤجر والبنك على سجل واحد. ويتولى وكيل ذكي المعاملات، ويطلب موافقتك قبل أن يرسل أي شيء.',
          )}
        </p>
        <div className="hub-rise flex flex-col gap-3 sm:flex-row" style={rise(4)}>
          {/* A full load, so the tour always starts clean from the query string. */}
          <a
            href="/?tour=demo"
            className={cn(LINK_BUTTON, 'bg-solid text-solid-fg hover:bg-solid/90')}
          >
            <Play className="size-4 rtl:-scale-x-100" aria-hidden />
            {l('Start the guided tour', 'ابدأ الجولة الإرشادية')}
          </a>
          <a
            href="/?tour=features"
            className={cn(
              LINK_BUTTON,
              'border border-line-strong bg-surface text-fg hover:bg-hover',
            )}
          >
            <Compass className="size-4" aria-hidden />
            {l('Full feature tour', 'جولة كل الميزات')}
          </a>
        </div>
      </div>
      <div className="hub-rise relative min-h-0 lg:min-h-[28rem]" style={rise(3)}>
        <Illustration
          variant="journey"
          decorative
          priority
          aspect="landscape"
          sizes="(min-width: 1024px) 640px, 100vw"
          className="lg:absolute lg:inset-0 lg:aspect-auto lg:h-full dark:brightness-90"
        />
      </div>
    </section>
  );
}

interface Role {
  id: 'newcomer' | 'employer' | 'landlord' | 'bank';
  href: string;
  icon: LucideIcon;
  tile: string;
  title: string;
  audience: string;
  body: string;
  open: string;
}

function roles(l: Copy): Role[] {
  return [
    {
      id: 'newcomer',
      href: '/newcomer',
      icon: Smartphone,
      tile: 'bg-[rgb(var(--brand-seafoam))]',
      title: l('Newcomer', 'الوافد'),
      audience: l('Phone app', 'تطبيق الهاتف'),
      body: l(
        'Sees the relocation roadmap, adds documents, and approves what the agent wants to send before it leaves.',
        'يرى خارطة الانتقال، ويضيف مستنداته، ويوافق على ما يريد الوكيل إرساله قبل أن يُرسل.',
      ),
      open: l('Open the newcomer app', 'افتح تطبيق الوافد'),
    },
    {
      id: 'employer',
      href: '/employer',
      icon: Building2,
      tile: 'bg-[rgb(var(--brand-sand))]',
      title: l('Employer', 'صاحب العمل'),
      audience: l('Dashboard', 'لوحة المتابعة'),
      body: l(
        'Follows every hire, sees what is blocked, and plans a team move or a company expansion.',
        'يتابع كل موظف جديد، ويرى ما تعطّل، ويخطط لنقل فريق أو لتوسّع الشركة.',
      ),
      open: l('Open the employer dashboard', 'افتح لوحة صاحب العمل'),
    },
    {
      id: 'landlord',
      href: '/landlord',
      icon: KeyRound,
      tile: 'bg-[rgb(var(--brand-coral))]',
      title: l('Landlord', 'المؤجر'),
      audience: l('Dashboard', 'لوحة المتابعة'),
      body: l(
        'Reviews rental applications with a plain-language risk summary, then approves, asks, offers terms or declines.',
        'يراجع طلبات الإيجار مع ملخص مخاطر بلغة واضحة، ثم يوافق أو يستفسر أو يعرض شروطًا أو يرفض.',
      ),
      open: l('Open the landlord dashboard', 'افتح لوحة المؤجر'),
    },
    {
      id: 'bank',
      href: '/bank',
      icon: Landmark,
      tile: 'bg-[rgb(var(--brand-saffron))]',
      title: l('Bank', 'البنك'),
      audience: l('Dashboard', 'لوحة المتابعة'),
      body: l(
        'Reviews account applications and sees only the data the newcomer agreed to share.',
        'يراجع طلبات فتح الحسابات ولا يرى إلا البيانات التي وافق الوافد على مشاركتها.',
      ),
      open: l('Open the bank dashboard', 'افتح لوحة البنك'),
    },
  ];
}

function RoleCard({
  role,
  l,
  index,
  className,
  children,
}: {
  role: Role;
  l: Copy;
  index: number;
  className?: string;
  children?: ReactNode;
}) {
  const Icon = role.icon;
  return (
    <article
      className={cn(
        'hub-rise group relative flex flex-col rounded-xl border border-edge bg-surface p-5 transition-colors hover:border-line-strong sm:p-6',
        className,
      )}
      style={rise(index)}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg text-[rgb(var(--brand-ink))]',
            role.tile,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-title font-medium text-fg">{role.title}</h3>
          <p className="text-label text-fg-tertiary">{role.audience}</p>
        </div>
      </div>
      <p className="mt-4 max-w-[40rem] text-body text-fg-secondary">{role.body}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link
          href={role.href}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-md text-body font-medium text-accent sm:min-h-9',
            STRETCH,
          )}
        >
          {role.open}
          <ArrowRight className="size-4 transition-colors rtl:-scale-x-100" aria-hidden />
        </Link>
        <a
          href={role.href}
          target="_blank"
          rel="noopener"
          className="relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-md text-label text-fg-secondary transition-colors hover:text-fg sm:min-h-9"
        >
          {l('Open in new window', 'افتح في نافذة جديدة')}
          <ExternalLink className="size-3.5 rtl:-scale-x-100" aria-hidden />
          <span className="sr-only">({role.title})</span>
        </a>
      </div>
      {children}
    </article>
  );
}

function statusLine(
  person: HubPerson,
  l: Copy,
): { text: string; tone: 'warning' | 'success' | 'danger' | 'muted' } {
  if (person.awaiting) {
    return { text: l('Approval waiting', 'بانتظار موافقتك'), tone: 'warning' };
  }
  if (person.status === 'settled') {
    return {
      text: l('Settled in Abu Dhabi', 'استقر في أبوظبي'),
      tone: 'success',
    };
  }
  if (person.status === 'blocked') {
    return {
      text: l(`Blocked: ${person.now ?? ''}`, `متعطل: ${person.now ?? ''}`),
      tone: 'danger',
    };
  }
  return {
    text: l(`Now: ${person.now ?? ''}`, `الآن: ${person.now ?? ''}`),
    tone: 'muted',
  };
}

const TONE_TEXT = {
  warning: 'text-warning',
  success: 'text-success',
  danger: 'text-danger',
  muted: 'text-fg-tertiary',
} as const;

function PersonRow({ person, l, featured }: { person: HubPerson; l: Copy; featured: boolean }) {
  const status = statusLine(person, l);
  return (
    <li className={cn(featured && 'sm:col-span-2')}>
      <Link
        href={person.href}
        className={cn(
          'relative z-10 flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
          featured
            ? 'border-accent bg-accent-soft hover:bg-accent-soft/70'
            : 'border-line bg-surface hover:border-line-strong hover:bg-hover',
        )}
      >
        <Avatar name={person.name} className="size-8" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-body font-medium text-fg">
              <bdi>{person.name}</bdi>
            </span>
            <span className="hidden truncate text-label text-fg-tertiary sm:inline">
              <bdi>{person.role}</bdi>
            </span>
          </span>
          <span className={cn('block text-label', TONE_TEXT[status.tone])}>
            {status.text}
            <span className="text-fg-tertiary sm:hidden">
              {' '}
              · <bdi>{person.role}</bdi>
            </span>
          </span>
        </span>
        {featured ? (
          <Badge tone="accent" className="shrink-0">
            {l('Start here', 'ابدأ من هنا')}
          </Badge>
        ) : null}
      </Link>
    </li>
  );
}

function Roles({ l, people }: { l: Copy; people: HubPerson[] }) {
  const all = roles(l);
  const newcomer = all[0];
  const others = all.slice(1);
  return (
    <section aria-labelledby="hub-roles" className="mt-14 sm:mt-20">
      <div className="hub-rise max-w-[40rem]" style={rise(5)}>
        <h2 id="hub-roles" className="text-[1.5rem] font-medium leading-8 text-fg">
          {l('Choose who you are', 'اختر دورك')}
        </h2>
        <p className="mt-1.5 text-title text-fg-secondary">
          {l(
            'Every role and every person has a link of their own, so each one can open in its own window.',
            'لكل دور ولكل شخص رابطه الخاص، فيُفتح كلٌّ في نافذته.',
          )}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {newcomer ? (
          <RoleCard role={newcomer} l={l} index={6}>
            <div className="mt-6 border-t border-line pt-5">
              <h4 className="text-label font-medium text-fg-secondary">
                {l('Open as a person', 'افتح كشخص بعينه')}
              </h4>
              {people.length > 0 ? (
                <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                  {people.map((person, index) => (
                    <PersonRow
                      key={person.id}
                      person={person}
                      l={l}
                      featured={index === 0 && person.awaiting}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-body text-fg-tertiary">
                  {l('No one is on the record yet.', 'لا أحد على السجل بعد.')}
                </p>
              )}
            </div>
          </RoleCard>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3 lg:grid-cols-1">
          {others.map((role, index) => (
            <RoleCard key={role.id} role={role} l={l} index={7 + index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveStrip({ l }: { l: Copy }) {
  const { locale } = useI18n();
  const { live } = useHub(locale);
  const connection = useConnection();
  const cells = [
    { n: live.journeys, label: l('Journeys underway', 'رحلات قيد التنفيذ') },
    { n: live.approvals, label: l('Approvals waiting', 'موافقات بالانتظار') },
    {
      n: live.inReview,
      label: l('Applications in review', 'طلبات قيد المراجعة'),
    },
    {
      n: live.guardChecks,
      label: l('Guard checks recorded', 'فحوصات حماية مسجلة'),
    },
  ];
  const status =
    connection === 'live'
      ? l('Live', 'مباشر')
      : connection === 'offline'
        ? l('Offline, showing the last state', 'غير متصل، تُعرض آخر حالة')
        : l('Connecting', 'جارٍ الاتصال');
  return (
    <section aria-labelledby="hub-live" className="mt-14 sm:mt-20">
      <div
        className="hub-rise flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
        style={rise(8)}
      >
        <h2 id="hub-live" className="text-title font-medium text-fg">
          {l('On the record right now', 'على السجل الآن')}
        </h2>
        <p className="flex items-center gap-2 text-label text-fg-secondary" role="status">
          <span
            aria-hidden
            className={cn(
              'size-2 rounded-full',
              connection === 'live' ? 'bg-success-solid' : 'bg-line-strong',
            )}
          />
          {status}
          <span className="text-fg-tertiary">
            {l('· changes from any window appear here', '· تظهر هنا تغييرات أي نافذة')}
          </span>
        </p>
      </div>
      <dl
        className="hub-rise mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-edge bg-line md:grid-cols-4"
        style={rise(9)}
      >
        {cells.map((cell) => (
          <div key={cell.label} className="bg-surface px-5 py-5 sm:px-6">
            <dd className="text-[2.25rem] font-medium leading-none tabular-nums text-fg">
              {cell.n}
            </dd>
            <dt className="mt-2 text-label text-fg-secondary">{cell.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Tool({
  href,
  icon: Icon,
  title,
  body,
  strong,
  index,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
  strong?: boolean;
  index: number;
}) {
  return (
    <li
      className={cn(
        'hub-rise relative flex items-start gap-3 rounded-xl border p-4 transition-colors sm:p-5',
        strong
          ? 'border-accent bg-accent-soft hover:bg-accent-soft/70'
          : 'border-edge bg-surface hover:border-line-strong hover:bg-subtle',
      )}
      style={rise(index)}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          strong ? 'bg-solid text-solid-fg' : 'bg-track text-fg',
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-body font-medium text-fg">
          <a href={href} className={cn('inline-block rounded-md', STRETCH)}>
            {title}
          </a>
        </h3>
        <p className="mt-0.5 text-label text-fg-secondary">{body}</p>
      </div>
      <ArrowRight className="mt-2 size-4 shrink-0 text-fg-tertiary rtl:-scale-x-100" aria-hidden />
    </li>
  );
}

function Presenter({ l }: { l: Copy }) {
  return (
    <section aria-labelledby="hub-tools" className="mt-14 sm:mt-20">
      <div className="max-w-[40rem]">
        <h2 id="hub-tools" className="text-[1.5rem] font-medium leading-8 text-fg">
          {l('Presenter tools', 'أدوات العرض')}
        </h2>
        <p className="mt-1.5 text-title text-fg-secondary">
          {l(
            'Start a tour, put the story back to its first state, or check what the app is holding.',
            'ابدأ جولة، أو أعد القصة إلى حالتها الأولى، أو راجع ما يحتفظ به التطبيق.',
          )}
        </p>
      </div>
      <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        <Tool
          strong
          index={10}
          href="/?tour=demo"
          icon={Play}
          title={l('Start the guided tour', 'ابدأ الجولة الإرشادية')}
          body={l(
            'The presenting route: what to show, in the order to tell it.',
            'مسار العرض: ما نعرضه، بالترتيب الذي نرويه به.',
          )}
        />
        <Tool
          index={11}
          href="/?tour=features"
          icon={Compass}
          title={l('Full feature tour', 'جولة كل الميزات')}
          body={l(
            'Every screen and feature, for questions and a closer look.',
            'كل شاشة وكل ميزة، للأسئلة ولنظرة أقرب.',
          )}
        />
      </ul>
      <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
        <Tool
          index={12}
          href="/design-system/state"
          icon={RotateCcw}
          title={l('Reset demo', 'إعادة ضبط العرض')}
          body={l(
            'Put the story back to its first state before a run.',
            'أعد القصة إلى حالتها الأولى قبل كل عرض.',
          )}
        />
        <Tool
          index={13}
          href="/design-system/state"
          icon={FileClock}
          title={l('Live state', 'الحالة المباشرة')}
          body={l(
            'Watch revisions arrive from every open window.',
            'تابع وصول التحديثات من كل نافذة مفتوحة.',
          )}
        />
        <Tool
          index={14}
          href="/employer/guard"
          icon={ScrollText}
          title={l('Guard log', 'سجل الحماية')}
          body={l(
            'The recorded Guard checks and the evaluation evidence.',
            'فحوصات الحماية المسجلة وأدلة التقييم.',
          )}
        />
      </ul>
    </section>
  );
}

function Honest({ l }: { l: Copy }) {
  const points = [
    {
      title: l('Nothing leaves the app', 'لا شيء يغادر التطبيق'),
      body: l(
        'Landlords, banks and government services are simulated here. No application, message or file is sent to a real party.',
        'الملاك والبنوك والخدمات الحكومية هنا محاكاة. لا يُرسل أي طلب أو رسالة أو ملف إلى جهة حقيقية.',
      ),
    },
    {
      title: l('Extraction is a labelled preview', 'الاستخراج معاينة موسومة'),
      body: l(
        'Reading a document shows a preview of what an extraction would return. Treat the values as examples, not as checked facts.',
        'قراءة المستند تعرض معاينة لما قد يُستخرج منه. عامل القيم كأمثلة لا كحقائق تم التحقق منها.',
      ),
    },
    {
      title: l('End-to-end safety is not proven', 'السلامة من البداية إلى النهاية غير مثبتة'),
      body: l(
        'Guard is meant to stop data the newcomer has not agreed to share. An archived evaluation allowed 12 of 25 forbidden synthetic flows; a newer measurement of the deployed release denied all 25 in each of 3 runs. That tests the policy decision only, so this demo does not claim the agent is safe.',
        'الحماية مصممة لمنع البيانات التي لم يوافق الوافد على مشاركتها. سمح تقييم مؤرشف بـ 12 من 25 مسارًا محظورًا اصطناعيًا، بينما رفضت قياسات أحدث للإصدار المنشور المسارات الـ 25 كلها في كل من 3 تجارب. وهذا يختبر قرار السياسة فقط، لذلك لا يدّعي هذا العرض أن الوكيل آمن.',
      ),
    },
  ];
  return (
    <section
      aria-labelledby="hub-real"
      className={cn('hub-rise mt-14 rounded-xl px-5 py-8 sm:mt-20 sm:px-10 sm:py-10', SAND_SOFT)}
      style={rise(15)}
    >
      <h2 id="hub-real" className="text-[1.5rem] font-medium leading-8 text-fg">
        {l('What is real in this demo', 'ما الحقيقي في هذا العرض')}
      </h2>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-3 md:gap-8">
        {points.map((point) => (
          <div key={point.title} className="border-t border-line-strong pt-4">
            <h3 className="text-body font-medium text-fg">{point.title}</h3>
            <p className="mt-1.5 text-body text-fg-secondary">{point.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-label">
        <a
          href="/employer/guard"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md font-medium text-accent hover:underline sm:min-h-8"
        >
          {l('See the Guard evidence', 'اطلع على أدلة الحماية')}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </a>
      </p>
    </section>
  );
}

export function DemoHub() {
  const { locale } = useI18n();
  const l: Copy = (en, ar) => (locale === 'ar' ? ar : en);
  const { people } = useHub(locale);
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <style>{HUB_CSS}</style>
      <Header />
      <main className="mx-auto w-full max-w-[75rem] px-4 pb-32 pt-2 sm:px-6 lg:px-8">
        <Hero l={l} />
        <Roles l={l} people={people} />
        <LiveStrip l={l} />
        <Presenter l={l} />
        <Honest l={l} />
      </main>
    </div>
  );
}
