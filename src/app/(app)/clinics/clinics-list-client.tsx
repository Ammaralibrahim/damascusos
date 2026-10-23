'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { StageBadge } from '@/components/status-badge';
import { scoreClinic } from '@/lib/scoring';
import { deleteClinicsAction } from './actions';
import { BulkDeleteDialog } from './bulk-delete-dialog';

type ClinicRow = {
  _id: string;
  name: string;
  area: string | null;
  city: string | null;
  stage: string;
  scores: unknown;
};

export function ClinicsListClient({ clinics }: { clinics: ClinicRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = selected.size > 0 && selected.size === clinics.length;
  const someSelected = selected.size > 0;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === clinics.length) return new Set();
      return new Set(clinics.map((c) => c._id));
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedClinics = useMemo(
    () => clinics.filter((c) => selected.has(c._id)),
    [clinics, selected],
  );

  async function handleBulkDelete(formData: FormData) {
    start(async () => {
      const result = await deleteClinicsAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDialogOpen(false);
      clearSelection();
      router.refresh();
    });
  }

  if (clinics.length === 0) return null;

  return (
    <>
      {/* شريط الإجراءات — يظهر فقط عند التحديد */}
      {someSelected && (
        <div className="sticky top-14 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 shadow-1">
          <span className="text-xs font-medium text-accent">
            {selected.size} محدد
          </span>
          <div className="flex-1" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            leadingIcon={<X size={13} strokeWidth={2} />}
          >
            إلغاء التحديد
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            leadingIcon={<Trash2 size={13} strokeWidth={2} />}
            onClick={() => {
              setError(null);
              setDialogOpen(true);
            }}
          >
            حذف المحدد
          </Button>
        </div>
      )}

      {/* رأس القائمة — checkbox "تحديد الكل" */}
      <div className="flex items-center gap-3 rounded-t-lg border border-b-0 border-line-subtle bg-surface-2 px-4 py-2.5 text-xs text-fg-secondary">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          aria-label="تحديد الكل"
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          {allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
        </span>
        <div className="flex-1" />
        <span className="tabular">
          {selected.size > 0 ? `${selected.size} من ${clinics.length}` : `${clinics.length} عيادة`}
        </span>
      </div>

      {/* القائمة */}
      <ul className="overflow-hidden rounded-b-lg border border-line-subtle bg-surface">
        {clinics.map((c, idx) => {
          const s = scoreClinic(c.scores as never);
          const isChecked = selected.has(c._id);
          return (
            <li
              key={c._id}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-fast ${
                idx !== clinics.length - 1 ? 'border-b border-line-subtle' : ''
              } ${isChecked ? 'bg-accent-soft/40' : 'hover:bg-subtle'}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(c._id)}
                aria-label={`تحديد ${c.name}`}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <Link
                href={`/clinics/${c._id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{c.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <StageBadge stage={c.stage} />
                    {c.area && (
                      <span className="text-[11px] text-fg-tertiary">{c.area}</span>
                    )}
                  </div>
                </div>
                {s.complete ? (
                  <Badge tone={s.total >= 70 ? 'ok' : s.total >= 40 ? 'warn' : 'bad'}>
                    {s.total}/100
                  </Badge>
                ) : (
                  <Badge tone="neutral">غير مكتمل</Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Dialog الحذف الجماعي */}
      <BulkDeleteDialog
        open={dialogOpen}
        clinics={selectedClinics}
        pending={pending}
        error={error}
        onClose={() => {
          if (!pending) setDialogOpen(false);
        }}
        onSubmit={handleBulkDelete}
      />
    </>
  );
}