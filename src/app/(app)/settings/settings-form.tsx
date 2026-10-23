'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Select } from '@/components/ui';
import { updateSettingsAction } from './actions';

type Initial = {
  displayName: string;
  projectName: string;
  defaultSector: string;
  defaultMarket: string;
  mainService: string;
  workStartHour: number;
  workEndHour: number;
  workDays: number[];
  timezone: string;
  currency: string;
  weeklyOutreachGoal: number;
  demoTimeLimitMinutes: number;
  inAppNotifications: boolean;
};

const DAYS = [
  ['0', 'الأحد'],
  ['1', 'الاثنين'],
  ['2', 'الثلاثاء'],
  ['3', 'الأربعاء'],
  ['4', 'الخميس'],
  ['5', 'الجمعة'],
  ['6', 'السبت'],
];

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        // workDays: checkbox multi-select
        formData.delete('workDays');
        const form = e.currentTarget;
        form
          .querySelectorAll<HTMLInputElement>('input[name="workDays"]:checked')
          .forEach((el) => formData.append('workDays', el.value));
        start(async () => {
          const r = await updateSettingsAction(formData);
          if (!r.ok) {
            setError(r.error);
            setSaved(false);
          } else {
            setError(null);
            setSaved(true);
            router.refresh();
          }
        });
      }}
    >
      <Field label="اسمك" htmlFor="displayName">
        <Input id="displayName" name="displayName" defaultValue={initial.displayName} required />
      </Field>
      <Field label="اسم المشروع" htmlFor="projectName">
        <Input id="projectName" name="projectName" defaultValue={initial.projectName} required />
      </Field>
      <Field label="القطاع الافتراضي" htmlFor="defaultSector">
        <Input id="defaultSector" name="defaultSector" defaultValue={initial.defaultSector} required />
      </Field>
      <Field label="السوق الافتراضي" htmlFor="defaultMarket">
        <Input id="defaultMarket" name="defaultMarket" defaultValue={initial.defaultMarket} required />
      </Field>
      <div className="md:col-span-2">
        <Field label="الخدمة الأساسية" htmlFor="mainService">
          <Input id="mainService" name="mainService" defaultValue={initial.mainService} required />
        </Field>
      </div>
      <Field label="بداية ساعات العمل" htmlFor="workStartHour">
        <Input
          id="workStartHour"
          name="workStartHour"
          type="number"
          min={0}
          max={23}
          defaultValue={initial.workStartHour}
          required
        />
      </Field>
      <Field label="نهاية ساعات العمل" htmlFor="workEndHour">
        <Input
          id="workEndHour"
          name="workEndHour"
          type="number"
          min={1}
          max={24}
          defaultValue={initial.workEndHour}
          required
        />
      </Field>
      <div className="md:col-span-2">
        <div className="mb-1 text-sm font-medium text-slate-700">أيام العمل</div>
        <div className="flex flex-wrap gap-3 text-sm">
          {DAYS.map(([v, label]) => (
            <label key={v} className="flex items-center gap-1">
              <input
                type="checkbox"
                name="workDays"
                value={v}
                defaultChecked={initial.workDays.includes(Number(v))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <Field label="المنطقة الزمنية" htmlFor="timezone">
        <Input id="timezone" name="timezone" defaultValue={initial.timezone} required />
      </Field>
      <Field label="العملة" htmlFor="currency">
        <Input id="currency" name="currency" defaultValue={initial.currency} maxLength={3} required />
      </Field>
      <Field label="هدف التواصل الأسبوعي" htmlFor="weeklyOutreachGoal">
        <Input
          id="weeklyOutreachGoal"
          name="weeklyOutreachGoal"
          type="number"
          min={0}
          max={500}
          defaultValue={initial.weeklyOutreachGoal}
          required
        />
      </Field>
      <Field label="حد وقت المشروع التجريبي (دقائق)" htmlFor="demoTimeLimitMinutes">
        <Input
          id="demoTimeLimitMinutes"
          name="demoTimeLimitMinutes"
          type="number"
          min={30}
          max={2000}
          defaultValue={initial.demoTimeLimitMinutes}
          required
        />
      </Field>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input
          type="checkbox"
          name="inAppNotifications"
          defaultChecked={initial.inAppNotifications}
        />
        تفعيل الإشعارات داخل التطبيق
      </label>

      <div className="md:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
        </Button>
        {saved && !pending && <span className="text-xs text-emerald-700">تم الحفظ.</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  );
}