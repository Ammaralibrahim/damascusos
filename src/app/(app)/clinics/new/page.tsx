'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { createClinicAction, type ActionResult } from '../actions';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';

export default function NewClinicPage() {
  const router = useRouter();
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        start(async () => {
          const result = await createClinicAction(formData);
          setState(result);
          if (result.ok && result.id) router.push(`/clinics/${result.id}`);
        });
      }}
    >
      <header className="flex items-end justify-between gap-3">
        <div>
          <Link
            href="/clinics"
            className="inline-flex items-center gap-1 text-xs text-fg-tertiary transition-colors duration-fast hover:text-fg"
          >
            <ArrowRight size={12} strokeWidth={1.75} />
            العيادات
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">عيادة جديدة</h1>
        </div>
      </header>

      {state && !state.ok && (
        <div role="alert" className="rounded-lg border border-bad bg-bad-bg p-3 text-sm text-bad">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p>{state.error}</p>
              {state.duplicates && (
                <ul className="mt-2 list-disc space-y-1 ps-5 text-xs">
                  {state.duplicates.map((d) => (
                    <li key={d.id}>
                      <a className="underline" href={`/clinics/${d.id}`}>{d.name}</a>
                      {d.area && ` — ${d.area}`}
                    </li>
                  ))}
                </ul>
              )}
              {state.duplicates && (
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input type="checkbox" name="confirmDuplicate" value="1" />
                  متابعة على أي حال (عيادة مختلفة)
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">البيانات الأساسية</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="اسم العيادة" htmlFor="name">
            <Input id="name" name="name" required autoFocus />
          </Field>
          <Field label="اسم الطبيب" htmlFor="doctorName">
            <Input id="doctorName" name="doctorName" />
          </Field>
          <Field label="المدينة" htmlFor="city">
            <Input id="city" name="city" defaultValue="دمشق" />
          </Field>
          <Field label="المنطقة" htmlFor="area">
            <Input id="area" name="area" />
          </Field>
          <Field label="الهاتف" htmlFor="phone">
            <Input id="phone" name="phone" inputMode="tel" dir="ltr" />
          </Field>
          <Field label="الموقع الإلكتروني" htmlFor="website">
            <Input id="website" name="website" placeholder="https://" dir="ltr" />
          </Field>
          <Field label="التواصل الاجتماعي" htmlFor="social">
            <Input id="social" name="social" dir="ltr" />
          </Field>
          <Field label="المصدر" htmlFor="source">
            <Input id="source" name="source" />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">التقييم الرقمي</h2>
        <p className="text-xs text-fg-secondary">اترك الحقول على "غير معروف" إن لم تتحقق منها بعد.</p>
        <div className="space-y-2">
          {[
            ['hasWebsite', 'لديها موقع؟'],
            ['mobileFriendly', 'يعمل جيدًا على الهاتف؟'],
            ['servicesClear', 'الخدمات واضحة؟'],
            ['basicInfoPresent', 'معلومات أساسية موجودة؟'],
            ['bookingPresent', 'وسيلة طلب موعد؟'],
            ['contactClear', 'وسائل التواصل واضحة؟'],
          ].map(([name, label]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-line-subtle bg-surface-2 px-3 py-2">
              <span className="text-sm text-fg">{label}</span>
              <Select name={name} defaultValue="unknown" className="max-w-[140px]">
                <option value="unknown">غير معروف</option>
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </Select>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="المشكلة الملاحظة" htmlFor="observedIssue">
            <Textarea id="observedIssue" name="observedIssue" rows={2} />
          </Field>
          <Field label="التحسين المقترح" htmlFor="suggestedImprovement">
            <Textarea id="suggestedImprovement" name="suggestedImprovement" rows={2} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">تقييم الفرصة</h2>
        <p className="text-xs text-fg-secondary">المجموع يُحسب تلقائيًا بحد أقصى 100 نقطة.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['scoreProblem', 'المشكلة', 25],
            ['scoreFit', 'الملاءمة', 20],
            ['scoreAccess', 'الوصول', 15],
            ['scoreInterest', 'الاهتمام', 25],
            ['scoreNextStep', 'الخطوة', 15],
          ].map(([name, label, max]) => (
            <Field key={String(name)} label={`${label} /${max}`} htmlFor={String(name)}>
              <Input
                id={String(name)}
                name={String(name)}
                type="number"
                min={0}
                max={Number(max)}
                defaultValue={0}
                dir="ltr"
              />
            </Field>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" name="scoringComplete" />
          التقييم مكتمل بناءً على معلومات مُتحقَّق منها
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">ملاحظات</h2>
        <Field label="ملاحظات (اختياري)" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={3} />
        </Field>
      </section>

      <div className="flex items-center gap-2 border-t border-line-subtle pt-4">
        <Button type="submit" disabled={pending} loading={pending} leadingIcon={<Save size={14} strokeWidth={1.75} />}>
          {pending ? 'جارٍ الحفظ…' : 'حفظ العيادة'}
        </Button>
        <Link
          href="/clinics"
          className="inline-flex h-9 items-center rounded-md px-3 text-sm text-fg-secondary transition-colors duration-fast hover:bg-subtle hover:text-fg"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}