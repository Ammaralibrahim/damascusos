'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, Field, Input } from '@/components/ui';
import { ConfirmDialog } from '@/components/confirm-dialog';

type ClinicRow = {
  _id: string;
  name: string;
};

export function BulkDeleteDialog({
  open,
  clinics,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  clinics: ClinicRow[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const [confirmWord, setConfirmWord] = useState('');

  const expected = `حذف ${clinics.length}`;
  const canDelete = confirmWord.trim() === expected || confirmWord.trim() === 'حذف';

  function handleConfirm() {
    const fd = new FormData();
    clinics.forEach((c) => fd.append('clinicIds', c._id));
    fd.set('confirmWord', confirmWord.trim());
    onSubmit(fd);
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`حذف ${clinics.length} ${clinics.length === 1 ? 'عيادة' : 'عيادات'} نهائيًا؟`}
      description="لا يمكن التراجع عن هذه العملية. ستُحذف جميع سجلات التواصل والمتابعات المرتبطة."
      confirmLabel={pending ? 'جارٍ الحذف…' : 'حذف نهائي'}
      loading={pending}
    >
      <div className="space-y-3">
        <div className="max-h-32 overflow-y-auto rounded-lg border border-line bg-surface-2 p-2 text-xs">
          <p className="mb-1 font-medium text-fg">العيادات المحددة:</p>
          <ul className="space-y-0.5 text-fg-secondary">
            {clinics.map((c) => (
              <li key={c._id} className="truncate">
                · {c.name}
              </li>
            ))}
          </ul>
        </div>

        <Field
          label={`اكتب «${expected}» للتأكيد`}
          htmlFor="bulk-confirm"
          hint={`مثال: ${expected} أو «حذف»`}
        >
          <Input
            id="bulk-confirm"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder={expected}
            autoComplete="off"
          />
        </Field>

        {error && <Alert tone="bad">{error}</Alert>}
        {!canDelete && (
          <p className="text-xs text-fg-tertiary">
            الزر معطّل حتى تُطابق الكلمة المطلوبة.
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}