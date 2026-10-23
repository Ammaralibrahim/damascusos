'use client';

import { useState, useTransition } from 'react';
import { Play, Pause, Check, RotateCcw, Plus, AlertTriangle } from 'lucide-react';
import {
  Button,
  Card,
  Empty,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
  Alert,
} from '@/components/ui';
import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge';
import { FocusControl } from '@/components/focus-control';
import { createTaskAction, transitionTaskAction, type Result } from './actions';

type TaskVM = {
  _id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  estimatedMinutes: number | null;
  isOverdue: boolean;
};

export function TodayClient({
  tasks,
  activeSession,
  availableMinutes,
}: {
  tasks: TaskVM[];
  activeSession: { _id: string; taskId: string; startedAt: string } | null;
  availableMinutes: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  const activeCount = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-md font-semibold text-fg">المهام</h2>
            <p className="mt-0.5 text-xs text-fg-secondary tabular">
              {activeCount} نشطة · {availableMinutes} دقيقة متاحة
            </p>
          </div>
          {!creating && (
            <Button
              size="sm"
              variant="primary"
              leadingIcon={<Plus size={14} strokeWidth={2} />}
              onClick={() => setCreating(true)}
            >
              مهمة جديدة
            </Button>
          )}
        </div>

        {creating && (
          <Card>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const form = e.currentTarget;
                start(async () => {
                  const r: Result = await createTaskAction(formData);
                  if (!r.ok) setError(r.error);
                  else {
                    setError(null);
                    form.reset();
                    setCreating(false);
                  }
                });
              }}
            >
              <Field label="العنوان" htmlFor="task-title" required>
                <Input id="task-title" name="title" required autoFocus />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="النوع" htmlFor="task-kind">
                  <Select id="task-kind" name="kind" defaultValue="admin">
                    <option value="research">بحث</option>
                    <option value="outreach">تواصل</option>
                    <option value="dev">تطوير</option>
                    <option value="admin">إداري</option>
                    <option value="learning">تعلّم</option>
                    <option value="review">مراجعة</option>
                  </Select>
                </Field>
                <Field label="الأولوية" htmlFor="task-priority">
                  <Select id="task-priority" name="priority" defaultValue="medium">
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الوقت التقديري (دقائق)" htmlFor="task-est">
                  <Input id="task-est" name="estimatedMinutes" type="number" min={5} max={600} />
                </Field>
                <Field label="تاريخ التنفيذ" htmlFor="task-scheduled">
                  <Input id="task-scheduled" name="scheduledFor" type="datetime-local" />
                </Field>
              </div>
              <Field label="وصف (اختياري)" htmlFor="task-description">
                <Textarea id="task-description" name="description" rows={2} />
              </Field>

              {error && (
                <Alert tone="bad" title="تعذّر الحفظ">
                  {error}
                </Alert>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button type="submit" size="sm" disabled={pending} loading={pending}>
                  حفظ المهمة
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setError(null);
                  }}
                  disabled={pending}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        )}

        {tasks.length === 0 ? (
          <Empty title="لا مهام اليوم" description="ابدأ بمهمة واحدة صغيرة لتحريك اليوم." />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
            {tasks.map((t, idx) => (
              <li
                key={t._id}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                  idx !== tasks.length - 1 ? 'border-b border-line-subtle' : ''
                }`}
              >
                <PriorityBadge priority={t.priority} />
                <TaskStatusBadge status={t.status} />
                {t.isOverdue && (
                  <span className="inline-flex items-center rounded-md border border-bad/30 bg-bad-bg px-2 py-0.5 text-[11px] font-medium text-bad">
                    متأخرة
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-fg">{t.title}</div>
                  {t.estimatedMinutes ? (
                    <div className="mt-0.5 text-[11px] text-fg-tertiary tabular">
                      {t.estimatedMinutes} دقيقة
                    </div>
                  ) : null}
                </div>

                <FocusControl taskId={t._id} activeSession={activeSession} />

                <div className="flex items-center gap-1">
                  {t.status === 'todo' && (
                    <>
                      <IconButton
                        label="ابدأ"
                        tone="primary"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const r = await transitionTaskAction(t._id, 'in_progress');
                            if (!r.ok) setError(r.error);
                            else setError(null);
                          })
                        }
                      >
                        <Play size={13} strokeWidth={2.5} />
                      </IconButton>
                      <IconButton
                        label="تأجيل"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const r = await transitionTaskAction(t._id, 'postponed');
                            if (!r.ok) setError(r.error);
                            else setError(null);
                          })
                        }
                      >
                        <Pause size={13} strokeWidth={2.5} />
                      </IconButton>
                    </>
                  )}
                  {t.status === 'in_progress' && (
                    <IconButton
                      label="إكمال"
                      tone="primary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const r = await transitionTaskAction(t._id, 'done');
                          if (!r.ok) setError(r.error);
                          else setError(null);
                        })
                      }
                    >
                      <Check size={13} strokeWidth={2.5} />
                    </IconButton>
                  )}
                  {t.status === 'postponed' && (
                    <IconButton
                      label="إعادة"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const r = await transitionTaskAction(t._id, 'todo');
                          if (!r.ok) setError(r.error);
                          else setError(null);
                        })
                      }
                    >
                      <RotateCcw size={13} strokeWidth={2.5} />
                    </IconButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {error && !creating && (
          <Alert tone="bad" title="حدث خطأ">
            {error}
          </Alert>
        )}
      </section>
    </div>
  );
}