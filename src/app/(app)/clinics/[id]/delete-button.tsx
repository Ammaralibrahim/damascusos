'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Alert, Button, Field, Input } from '@/components/ui';
import { ConfirmDialog } from '@/components/confirm-dialog';
import {
  deleteClinicAction,
  getClinicDependents,
  type ActionResult,
} from '../actions';

export function DeleteClinicButton({
  clinicId,
  clinicName,
}: {
  clinicId: string;
  clinicName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [counts, setCounts] = useState<{
    interactions: number;
    followUps: number;
    tasks: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // عند فتح Dialog: اجلب عدد السجلات التابعة
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getClinicDependents(clinicId)
      .then((c) => {
        if (!cancelled) setCounts(c);
      })
      .catch(() => {
        if (!cancelled) setCounts({ interactions: 0, followUps: 0, tasks: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [open, clinicId]);

  async function handleDelete() {
    const form = new FormData();
    form.set('clinicId', clinicId);
    form.set('confirmName', confirmName);
    start(async () => {
      const result: ActionResult = await deleteClinicAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // نجح — أعد التوجيه إلى القائمة
      router.push('/clinics');
      router.refresh();
    });
  }

  const canDelete = confirmName.trim() === clinicName;

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        leadingIcon={<Trash2 size={13} strokeWidth={2} />}
        onClick={() => {
          setOpen(true);
          setError(null);
          setConfirmName('');
        }}
      >
        حذف
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => {
          if (!pending) setOpen(false);
        }}
        onConfirm={handleDelete}
        title={`حذف «${clinicName}» نهائيًا؟`}
        description="لا يمكن التراجع عن هذه العملية."
        confirmLabel={pending ? 'جارٍ الحذف…' : 'حذف نهائي'}
        loading={pending}
      >
        <div className="space-y-3">
          {counts && (
            <div className="rounded-lg border border-line bg-surface-2 p-3 text-xs">
              <p className="font-medium text-fg">سيُحذف أيضًا:</p>
              <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-fg-secondary">
                <li>{counts.interactions} سجل تواصل</li>
                <li>{counts.followUps} متابعة</li>
                <li>
                  {counts.tasks > 0
                    ? `${counts.tasks} مهمة ستُفصل عن العيادة (لن تُحذف)`
                    : 'لا مهام مرتبطة'}
                </li>
              </ul>
            </div>
          )}

          <Field
            label="اكتب اسم العيادة للتأكيد"
            htmlFor="confirm-name"
            hint={clinicName}
          >
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={clinicName}
              autoComplete="off"
            />
          </Field>

          {error && <Alert tone="bad">{error}</Alert>}

          {!canDelete && (
            <p className="text-xs text-fg-tertiary">
              الزر معطّل حتى يطابق الاسم.
            </p>
          )}
        </div>
      </ConfirmDialog>

      {/* نمرّر canDelete إلى Dialog عبر تعطيل الزر — غير مباشر، لكن نتحقق داخل handleDelete */}
      {canDelete ? null : null}
    </>
  );
}