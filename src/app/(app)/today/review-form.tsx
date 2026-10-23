'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Button, Field, Textarea } from '@/components/ui';
import { upsertReviewAction } from './actions';

export function ReviewForm({
  initial,
}: {
  initial: { obstacle: string; nextStep: string; notes: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        start(async () => {
          const r = await upsertReviewAction(formData);
          if (!r.ok) {
            setError(r.error);
            setSaved(false);
          } else {
            setError(null);
            setSaved(true);
          }
        });
      }}
    >
      <Field label="أهم عقبة اليوم" htmlFor="obstacle">
        <Textarea id="obstacle" name="obstacle" rows={2} defaultValue={initial.obstacle} />
      </Field>
      <Field label="الخطوة التالية" htmlFor="nextStep">
        <Textarea id="nextStep" name="nextStep" rows={2} defaultValue={initial.nextStep} />
      </Field>
      <Field label="ملاحظات" htmlFor="review-notes">
        <Textarea id="review-notes" name="notes" rows={2} defaultValue={initial.notes} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending} loading={pending}>
          حفظ المراجعة
        </Button>
        {saved && !pending && (
          <span className="inline-flex items-center gap-1 text-xs text-ok">
            <Check size={12} strokeWidth={2} />
            تم الحفظ
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1 text-xs text-bad">
            <AlertTriangle size={12} strokeWidth={1.75} />
            {error}
          </span>
        )}
      </div>
    </form>
  );
}