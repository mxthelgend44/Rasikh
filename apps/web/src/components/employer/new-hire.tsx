'use client';

import { DEMO_FIXTURES } from '@rasikh/shared';
import { useState, type FormEvent } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoNow } from '@/domain/clock';
import type { AbuDhabiArea } from '@/domain/types';
import { useAppState, useStore } from '@/store/provider';
import {
  BusyIcon,
  Feedback,
  inputClass,
  Modal,
  useEmployerAction,
  useEmployerCopy,
} from './common';
import { useEmployerScope } from './scope';

const areas: AbuDhabiArea[] = [
  'Al Reem Island',
  'Al Maryah Island',
  'Khalifa City',
  'Al Raha Beach',
  'Saadiyat Island',
  'Yas Island',
  'Mohammed Bin Zayed City',
];
const empty = {
  fullName: '',
  email: '',
  role: '',
  department: '',
  nationality: '',
  originCity: '',
  originCountry: '',
  salary: '',
  area: 'Al Reem Island',
  startDate: '',
  children: '0',
  spouse: false,
  backed: true,
};

export function NewHireDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { e, locale } = useEmployerCopy();
  const { employerId, employer } = useEmployerScope();
  const state = useAppState();
  const store = useStore();
  const action = useEmployerAction();
  const [fields, setFields] = useState({ ...empty, startDate: demoNow(state).slice(0, 10) });
  const field = (key: keyof typeof fields, value: string | boolean) =>
    setFields((previous) => ({ ...previous, [key]: value }));
  const textFields: {
    key:
      | 'fullName'
      | 'email'
      | 'role'
      | 'department'
      | 'nationality'
      | 'originCity'
      | 'originCountry'
      | 'salary'
      | 'startDate';
    en: string;
    ar: string;
    type?: string;
    placeholder?: string;
  }[] = [
    {
      key: 'fullName',
      en: 'Full name',
      ar: 'الاسم الكامل',
      placeholder: e('As shown on their passport', 'كما هو في جواز السفر'),
    },
    {
      key: 'email',
      en: 'Email',
      ar: 'البريد الإلكتروني',
      type: 'email',
      placeholder: 'name@example.com',
    },
    {
      key: 'role',
      en: 'Role',
      ar: 'المسمى الوظيفي',
      placeholder: e('Software engineer', 'مهندس برمجيات'),
    },
    { key: 'department', en: 'Department', ar: 'القسم', placeholder: e('Platform', 'المنصة') },
    { key: 'nationality', en: 'Nationality', ar: 'الجنسية' },
    { key: 'originCity', en: 'Moving from · city', ar: 'مدينة الانتقال' },
    { key: 'originCountry', en: 'Country', ar: 'البلد' },
    {
      key: 'salary',
      en: 'Est. monthly salary (AED)',
      ar: 'الراتب الشهري التقديري (درهم)',
      type: 'number',
    },
    { key: 'startDate', en: 'Work start date', ar: 'تاريخ بدء العمل', type: 'date' },
  ];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The first hire of a demo takes the contract fixture id (INTEGRATION.md section 5) so Guard
    // and TAMM fixtures line up; later hires get a unique id.
    const id = Object.hasOwn(state.hires, DEMO_FIXTURES.hire)
      ? `hire_${crypto.randomUUID()}`
      : DEMO_FIXTURES.hire;
    const saved = await action.run(
      {
        type: 'hire.create',
        id,
        backed: fields.backed,
        hire: {
          employerId,
          fullName: fields.fullName.trim(),
          email: fields.email.trim(),
          role: fields.role.trim(),
          department: fields.department.trim(),
          nationality: fields.nationality.trim(),
          originCity: fields.originCity.trim(),
          originCountry: fields.originCountry.trim(),
          estMonthlySalaryAed: Number(fields.salary),
          preferredArea: fields.area as AbuDhabiArea,
          startDate: fields.startDate,
          family: { spouse: fields.spouse, children: Number(fields.children) },
          locale,
        },
      },
      e('Hire added to the shared pipeline.', 'تمت إضافة الموظف إلى المسار المشترك.'),
    );
    if (saved) {
      const added = store.getSnapshot().state.hires[id];
      if (added) onCreated(added.id);
      else onClose();
    }
  }
  return (
    <Modal
      title={e('Start a new journey', 'ابدأ رحلة جديدة')}
      description={e(
        `Add a hire for ${employer?.name ?? ''}. Their own roadmap will appear immediately.`,
        `أضف موظفاً لدى ${employer?.name ?? ''}. ستظهر خارطة انتقاله فوراً.`,
      )}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <fieldset disabled={action.busy} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent-soft p-3">
            <p className="text-label leading-5 text-accent">
              {e(
                'Demo workspace · no invitation email is sent.',
                'مساحة تجريبية · لن يتم إرسال بريد دعوة.',
              )}
            </p>
            <Button
              size="sm"
              variant="ghost"
              icon={<Sparkles />}
              onClick={() =>
                setFields({
                  ...fields,
                  fullName: 'Nadia Rahman',
                  email: 'nadia.rahman@mail.example',
                  role: 'Product engineer',
                  department: 'Product',
                  nationality: 'British',
                  originCity: 'London',
                  originCountry: 'United Kingdom',
                  salary: '26000',
                  children: '0',
                })
              }
            >
              {e('Use sample', 'استخدم مثالاً')}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map(({ key, en, ar, type, placeholder }) => (
              <label
                key={key}
                className={key === 'fullName' ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}
              >
                <span className="block text-label font-medium">{e(en, ar)}</span>
                <input
                  required
                  maxLength={160}
                  min={type === 'number' ? 1 : undefined}
                  type={type ?? 'text'}
                  value={String(fields[key])}
                  onChange={(event) => field(key, event.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </label>
            ))}
            <label className="space-y-1.5">
              <span className="block text-label font-medium">
                {e('Preferred area', 'المنطقة المفضلة')}
              </span>
              <select
                value={fields.area}
                onChange={(event) => field('area', event.target.value)}
                className={inputClass}
              >
                {areas.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="rounded-xl border border-edge p-4">
            <legend className="px-1 text-label font-medium">
              {e('Family moving with them', 'أفراد الأسرة المنتقلون')}
            </legend>
            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-2 text-body">
                <input
                  type="checkbox"
                  checked={fields.spouse}
                  onChange={(event) => field('spouse', event.target.checked)}
                  className="size-4 accent-accent"
                />
                {e('Spouse / partner', 'الزوج أو الزوجة')}
              </label>
              <label className="flex items-center gap-3 text-body">
                <span>{e('Children', 'الأطفال')}</span>
                <input
                  type="number"
                  min={0}
                  max={12}
                  required
                  value={fields.children}
                  onChange={(event) => field('children', event.target.value)}
                  className={`${inputClass} !w-20`}
                />
              </label>
            </div>
            <p className="mt-3 text-caption leading-5 text-fg-tertiary">
              {e(
                'Adds family sponsorship and school steps when needed.',
                'تتم إضافة خطوات كفالة الأسرة والتسجيل في المدرسة عند الحاجة.',
              )}
            </p>
          </fieldset>
          <label className="flex items-start gap-3 rounded-xl border border-edge p-4">
            <input
              type="checkbox"
              checked={fields.backed}
              onChange={(event) => field('backed', event.target.checked)}
              className="mt-1 size-4 accent-accent"
            />
            <span>
              <span className="block text-body font-medium">
                {e('Back this hire as the employer', 'دعم الموظف باسم صاحب العمل')}
              </span>
              <span className="mt-1 block text-label leading-5 text-fg-tertiary">
                {e(
                  'Attach employer backing to their rental and bank applications in the demo.',
                  'إرفاق دعم صاحب العمل بطلبات السكن والحساب المصرفي في العرض التجريبي.',
                )}
              </span>
            </span>
          </label>
          <Feedback action={action} />
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={onClose}>
              {e('Cancel', 'إلغاء')}
            </Button>
            <Button
              size="lg"
              type="submit"
              disabled={action.busy}
              icon={action.busy ? <BusyIcon busy /> : <Plus />}
            >
              {e('Create roadmap', 'إنشاء خارطة الانتقال')}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
