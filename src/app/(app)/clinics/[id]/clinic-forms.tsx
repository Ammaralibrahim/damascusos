'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Save } from 'lucide-react';
import {
  Alert,
  Button,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { changeStageAction, createInteractionAction } from '../actions';
import { createFollowUpAction } from '../../followups/actions';

const STAGES: [string, string][] = [
  ['new', 'جديدة'],
  ['verifying', 'قيد التحقق'],
  ['qualified', 'مؤهلة'],
  ['contacted', 'تم التواصل'],
  ['awaiting_reply', 'بانتظار الرد'],
  ['initial_interest', 'اهتمام مبدئي'],
  ['discussing', 'مناقشة الاحتياجات'],
  ['demo', 'عرض تجريبي'],
  ['quote', 'عرض سعر'],
  ['negotiation', 'تفاوض'],
  ['won', 'تم الاتفاق'],
  ['paid', 'عميل مدفوع'],
  ['not_interested', 'غير مهتم'],
  ['future_followup', 'متابعة مستقبلية'],
];

/* ============================================================
   STAGE SELECTOR
   ============================================================ */
export function StageSelector({
  clinicId,
  current,
}: {
  clinicId: string;
  current: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set('clinicId', clinicId);
        start(async () => {
          const r = await changeStageAction(formData);
          if (!r.ok) setError(r.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <div className="min-w-0 flex-1">
        <Field label="المرحلة" htmlFor="stage-select">
          <Select id="stage-select" name="stage" defaultValue={current}>
            {STAGES.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="min-w-0 flex-1">
        <Field label="سبب الخسارة (اختياري)" htmlFor="lost-reason">
          <Input
            id="lost-reason"
            name="lostReason"
            placeholder="إذا كانت المرحلة غير مهتم"
          />
        </Field>
      </div>
      <Button type="submit" variant="secondary" size="md" disabled={pending} loading={pending}>
        تحديث المرحلة
      </Button>
      {error && (
        <div className="w-full">
          <Alert tone="bad">{error}</Alert>
        </div>
      )}
    </form>
  );
}

/* ============================================================
   INTERACTION FORM
   ============================================================ */
export function InteractionForm({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set('clinicId', clinicId);
        start(async () => {
          const r = await createInteractionAction(formData);
          if (!r.ok) setError(r.error);
          else {
            setError(null);
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <Field label="نوع التواصل" htmlFor="int-type" required>
        <Select id="int-type" name="type" defaultValue="call">
          <option value="call">مكالمة</option>
          <option value="message">رسالة</option>
          <option value="reply">رد</option>
          <option value="meeting">اجتماع</option>
          <option value="demo">عرض تجريبي</option>
          <option value="quote">عرض سعر</option>
          <option value="followup">متابعة</option>
          <option value="note">ملاحظة</option>
        </Select>
      </Field>
      <Field label="التاريخ والوقت" htmlFor="int-date">
        <Input
          id="int-date"
          name="occurredAt"
          type="datetime-local"
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="الملخص" htmlFor="int-summary" required>
          <Textarea
            id="int-summary"
            name="summary"
            rows={3}
            placeholder="ماذا حدث في هذا التواصل؟"
            required
          />
        </Field>
      </div>
      <Field label="النتيجة" htmlFor="int-outcome">
        <Input id="int-outcome" name="outcome" placeholder="مثال: لم يجب" />
      </Field>
      <Field label="الخطوة التالية" htmlFor="int-next">
        <Input id="int-next" name="nextStep" placeholder="مثال: إعادة الاتصال" />
      </Field>
      <div className="md:col-span-2 flex items-center gap-2">
        <Button
          type="submit"
          variant="primary-soft"
          size="md"
          disabled={pending}
          loading={pending}
          leadingIcon={<Save size={14} strokeWidth={1.75} />}
        >
          حفظ التواصل
        </Button>
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

/* ============================================================
   FOLLOW UP FORM
   ============================================================ */
export function FollowUpForm({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set('clinicId', clinicId);
        start(async () => {
          const r = await createFollowUpAction(formData);
          if (!r.ok) setError(r.error);
          else {
            setError(null);
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <Field label="الموعد" htmlFor="fu-date">
        <Input id="fu-date" name="dueAt" type="datetime-local" />
      </Field>
      <Field label="الملاحظة" htmlFor="fu-note" required>
        <Input id="fu-note" name="note" placeholder="مثال: متابعة عرض السعر" required />
      </Field>
      <Button
        type="submit"
        variant="primary-soft"
        size="md"
        disabled={pending}
        loading={pending}
      >
        إضافة متابعة
      </Button>
      {error && (
        <div className="sm:col-span-3">
          <Alert tone="bad">{error}</Alert>
        </div>
      )}
    </form>
  );
}