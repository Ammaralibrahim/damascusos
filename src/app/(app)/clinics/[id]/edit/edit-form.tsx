'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, X, AlertTriangle } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Section,
  Select,
  Textarea,
} from '@/components/ui';
import { updateClinicAction, type ActionResult } from '../../actions';
import type { ClinicTypeConfig } from '@/lib/clinic-types';

type Digital = 'yes' | 'no' | 'unknown';

export type EditFormInitial = {
  name: string;
  clinicType: string;
  doctorName: string;
  city: string;
  area: string;
  phone: string;
  website: string;
  social: string;
  source: string;
  notes: string;
  hasWebsite: Digital;
  mobileFriendly: Digital;
  servicesClear: Digital;
  basicInfoPresent: Digital;
  bookingPresent: Digital;
  contactClear: Digital;
  observedIssue: string;
  suggestedImprovement: string;
  scoreProblem: number;
  scoreFit: number;
  scoreAccess: number;
  scoreInterest: number;
  scoreNextStep: number;
  scoringComplete: boolean;
};

const DIGITAL_FIELDS: { key: keyof EditFormInitial; label: string }[] = [
  { key: 'hasWebsite', label: 'لديها موقع إلكتروني' },
  { key: 'mobileFriendly', label: 'يعمل جيدًا على الهاتف' },
  { key: 'servicesClear', label: 'الخدمات واضحة' },
  { key: 'basicInfoPresent', label: 'المعلومات الأساسية موجودة' },
  { key: 'bookingPresent', label: 'وسيلة طلب موعد متاحة' },
  { key: 'contactClear', label: 'وسائل التواصل واضحة' },
];

const SCORE_FIELDS: { key: keyof EditFormInitial; label: string; max: number }[] =
  [
    { key: 'scoreProblem', label: 'المشكلة', max: 25 },
    { key: 'scoreFit', label: 'الملاءمة', max: 20 },
    { key: 'scoreAccess', label: 'الوصول', max: 15 },
    { key: 'scoreInterest', label: 'الاهتمام', max: 25 },
    { key: 'scoreNextStep', label: 'الخطوة', max: 15 },
  ];

export function EditForm({
  clinicId,
  initial,
  clinicTypes,
}: {
  clinicId: string;
  initial: EditFormInitial;
  clinicTypes: ClinicTypeConfig[];
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set('clinicId', clinicId);

        const complete = form.querySelector<HTMLInputElement>(
          'input[name="scoringComplete"]',
        );
        formData.set('scoringComplete', complete?.checked ? 'true' : 'false');

        start(async () => {
          const result = await updateClinicAction(formData);
          setState(result);
          if (result.ok) {
            router.push(`/clinics/${clinicId}`);
            router.refresh();
          }
        });
      }}
    >
      {state && !state.ok && (
        <Alert tone="bad" title="تعذّر الحفظ">
          {state.error}
        </Alert>
      )}

      <Section title="البيانات الأساسية" divided={false}>
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="اسم العيادة" htmlFor="name" required>
              <Input id="name" name="name" defaultValue={initial.name} required />
            </Field>
            <Field label="نوع العيادة" htmlFor="clinicType">
              <Select
                id="clinicType"
                name="clinicType"
                defaultValue={initial.clinicType}
              >
                <option value="">— غير محدد —</option>
                {clinicTypes
                  .filter((t) => t.active || t.slug === initial.clinicType)
                  .map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="اسم الطبيب" htmlFor="doctorName">
              <Input
                id="doctorName"
                name="doctorName"
                defaultValue={initial.doctorName}
              />
            </Field>
            <Field label="المدينة" htmlFor="city">
              <Input id="city" name="city" defaultValue={initial.city} />
            </Field>
            <Field label="المنطقة" htmlFor="area">
              <Input id="area" name="area" defaultValue={initial.area} />
            </Field>
            <Field label="الهاتف" htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                defaultValue={initial.phone}
                dir="ltr"
              />
            </Field>
            <Field label="الموقع الإلكتروني" htmlFor="website">
              <Input
                id="website"
                name="website"
                defaultValue={initial.website}
                dir="ltr"
                placeholder="https://"
              />
            </Field>
            <Field label="التواصل الاجتماعي" htmlFor="social">
              <Input
                id="social"
                name="social"
                defaultValue={initial.social}
                dir="ltr"
              />
            </Field>
            <Field label="المصدر" htmlFor="source">
              <Input id="source" name="source" defaultValue={initial.source} />
            </Field>
          </div>
        </Card>
      </Section>

      <Section
        title="التقييم الرقمي"
        description="اترك الحقل على «غير معروف» إن لم تتحقق منه."
      >
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {DIGITAL_FIELDS.map(({ key, label }) => {
              const value = initial[key] as Digital;
              return (
                <Field key={key} label={label} htmlFor={`digital-${key}`}>
                  <Select
                    id={`digital-${key}`}
                    name={key}
                    defaultValue={value}
                  >
                    <option value="unknown">غير معروف</option>
                    <option value="yes">نعم</option>
                    <option value="no">لا</option>
                  </Select>
                </Field>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="المشكلة الملاحظة" htmlFor="observedIssue">
              <Textarea
                id="observedIssue"
                name="observedIssue"
                rows={3}
                defaultValue={initial.observedIssue}
              />
            </Field>
            <Field label="التحسين المقترح" htmlFor="suggestedImprovement">
              <Textarea
                id="suggestedImprovement"
                name="suggestedImprovement"
                rows={3}
                defaultValue={initial.suggestedImprovement}
              />
            </Field>
          </div>
        </Card>
      </Section>

      <Section
        title="تقييم فرصة البيع"
        description="المجموع يُحسب تلقائيًا بحد أقصى 100 نقطة."
      >
        <Card>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {SCORE_FIELDS.map(({ key, label, max }) => (
              <Field key={key} label={`${label} /${max}`} htmlFor={key}>
                <Input
                  id={key}
                  name={key}
                  type="number"
                  min={0}
                  max={max}
                  defaultValue={initial[key] as number}
                  dir="ltr"
                />
              </Field>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              name="scoringComplete"
              defaultChecked={initial.scoringComplete}
            />
            التقييم مكتمل بناءً على معلومات مُتحقَّق منها
          </label>
        </Card>
      </Section>

      <Section title="ملاحظات داخلية">
        <Card>
          <Field label="ملاحظات" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={initial.notes}
            />
          </Field>
        </Card>
      </Section>

      <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-4">
        <Button
          type="submit"
          variant="primary-soft"
          disabled={pending}
          loading={pending}
          leadingIcon={<Save size={14} strokeWidth={1.75} />}
        >
          {pending ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
        </Button>
        <Link
          href={`/clinics/${clinicId}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3.5 text-sm font-medium text-fg shadow-1 transition-[background-color,border-color,transform] duration-fast hover:bg-hover active:translate-y-px"
        >
          <X size={14} strokeWidth={1.75} />
          إلغاء
        </Link>
        {state && !state.ok && (
          <span className="inline-flex items-center gap-1 text-xs text-bad">
            <AlertTriangle size={12} strokeWidth={1.75} />
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}