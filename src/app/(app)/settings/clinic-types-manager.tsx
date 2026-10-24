'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Field,
  IconButton,
  Input,
} from '@/components/ui';
import {
  addClinicTypeAction,
  updateClinicTypeAction,
  deleteClinicTypeAction,
} from './actions';
import type { ClinicTypeConfig } from '@/lib/clinic-types';

export function ClinicTypesManager({
  initialTypes,
}: {
  initialTypes: ClinicTypeConfig[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleAdd(formData: FormData) {
    start(async () => {
      const r = await addClinicTypeAction(formData);
      if (!r.ok) setError(r.error);
      else {
        setError(null);
        setAdding(false);
        router.refresh();
      }
    });
  }

  function handleUpdate(formData: FormData) {
    start(async () => {
      const r = await updateClinicTypeAction(formData);
      if (!r.ok) setError(r.error);
      else {
        setError(null);
        setEditing(null);
        router.refresh();
      }
    });
  }

  function handleDelete(slug: string) {
    const fd = new FormData();
    fd.set('slug', slug);
    start(async () => {
      const r = await deleteClinicTypeAction(fd);
      if (!r.ok) setError(r.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-fg-secondary">{initialTypes.length} نوع متاح</p>
        {!adding && (
          <Button
            type="button"
            size="sm"
            variant="primary-soft"
            leadingIcon={<Plus size={13} strokeWidth={2} />}
            onClick={() => setAdding(true)}
          >
            نوع جديد
          </Button>
        )}
      </div>

      {error && <Alert tone="bad">{error}</Alert>}

      {adding && (
        <form
          className="space-y-3 rounded-lg border border-accent/30 bg-accent-soft/30 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(new FormData(e.currentTarget));
          }}
        >
          <Field label="اسم النوع" htmlFor="new-type-label" required>
            <Input
              id="new-type-label"
              name="label"
              placeholder="مثال: عيادة عيون"
              required
              autoFocus
            />
          </Field>
          <Field label="وصف مختصر (اختياري)" htmlFor="new-type-desc">
            <Input id="new-type-desc" name="description" />
          </Field>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending} loading={pending}>
              إضافة
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
              disabled={pending}
            >
              إلغاء
            </Button>
          </div>
        </form>
      )}

      <ul className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
        {initialTypes.map((t, idx) => {
          const isEditing = editing === t.slug;
          return (
            <li
              key={t.slug}
              className={`px-3 py-3 ${
                idx !== initialTypes.length - 1 ? 'border-b border-line-subtle' : ''
              }`}
            >
              {isEditing ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate(new FormData(e.currentTarget));
                  }}
                >
                  <input type="hidden" name="slug" value={t.slug} />
                  <Field label="الاسم" htmlFor={`label-${t.slug}`}>
                    <Input
                      id={`label-${t.slug}`}
                      name="label"
                      defaultValue={t.label}
                      required
                      autoFocus
                    />
                  </Field>
                  <Field label="الوصف" htmlFor={`desc-${t.slug}`}>
                    <Input
                      id={`desc-${t.slug}`}
                      name="description"
                      defaultValue={t.description ?? ''}
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={t.active}
                    />
                    مُفعَّل
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={pending}
                      loading={pending}
                      leadingIcon={<Save size={13} strokeWidth={1.75} />}
                    >
                      حفظ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                      disabled={pending}
                      leadingIcon={<X size={13} strokeWidth={2} />}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-fg">
                        {t.label}
                      </span>
                      {t.builtin && <Badge tone="neutral">مدمج</Badge>}
                      {!t.active && <Badge tone="warn">معطّل</Badge>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-fg-tertiary">
                      {t.slug}
                      {t.description && ` · ${t.description}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="تعديل"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        setEditing(t.slug);
                      }}
                    >
                      <Pencil size={12} strokeWidth={2} />
                    </IconButton>
                    <IconButton
                      label="حذف"
                      tone="danger"
                      size="sm"
                      disabled={pending || t.builtin}
                      onClick={() => {
                        if (
                          confirm(`حذف نوع "${t.label}"؟ لا يمكن التراجع.`)
                        ) {
                          setError(null);
                          handleDelete(t.slug);
                        }
                      }}
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </IconButton>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-fg-tertiary">
        الأنواع المدمجة لا يمكن حذفها، لكن يمكن تعطيلها. الأنواع المستخدمة في
        عيادات موجودة لا يمكن حذفها.
      </p>
    </div>
  );
}