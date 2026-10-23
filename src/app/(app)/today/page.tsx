import { AlertTriangle } from 'lucide-react';
import { requireSession } from '@/lib/auth';
import {
  getSettings,
  todayTasks,
  activeFocusSession,
  todayReview,
  todayCompletedTasks,
  todayInteractions,
} from '@/lib/data';
import { TodayClient } from './today-client';
import { ReviewForm } from './review-form';

export default async function TodayPage() {
  const session = await requireSession();
  const [settings, tasks, focus, review, completed, interactions] = await Promise.all([
    getSettings(session.userId),
    todayTasks(),
    activeFocusSession(session.userId),
    todayReview(session.userId),
    todayCompletedTasks(),
    todayInteractions(),
  ]);

  const availableMinutes = Math.max(0, (settings.workEndHour - settings.workStartHour) * 60);
  const totalEstimated = tasks
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    .reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);
  const overLimit = totalEstimated > availableMinutes;

  const activeSession = focus
    ? {
        _id: String(focus._id),
        taskId: String(focus.taskId),
        startedAt: focus.startedAt.toISOString(),
      }
    : null;

  // بداية اليوم لحساب isOverdue
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs text-fg-tertiary">يومي</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">المهام والمراجعة</h1>
      </header>

      {overLimit && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-warn bg-warn-bg px-4 py-3 text-sm text-warn"
        >
          <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">الوقت المتاح أقل من المخطط</p>
            <p className="mt-0.5 text-xs text-warn/80">
              المجموع التقديري {totalEstimated} دقيقة · المتاح {availableMinutes} دقيقة. راجع أولوياتك.
            </p>
          </div>
        </div>
      )}

      <TodayClient
        tasks={tasks.map((t) => ({
          _id: String(t._id),
          title: t.title,
          description: t.description ?? null,
          priority: t.priority,
          status: t.status,
          estimatedMinutes: t.estimatedMinutes ?? null,
          isOverdue:
            t.scheduledFor != null && new Date(t.scheduledFor) < todayStart,
        }))}
        activeSession={activeSession}
        availableMinutes={availableMinutes}
      />

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">المراجعة اليومية</h2>
        <ReviewForm
          initial={{
            obstacle: review?.obstacle ?? '',
            nextStep: review?.nextStep ?? '',
            notes: review?.notes ?? '',
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">
          مكتملة اليوم{completed.length > 0 && ` (${completed.length})`}
        </h2>
        {completed.length === 0 ? (
          <p className="text-sm text-fg-secondary">لا شيء بعد.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg bg-surface shadow-1">
            {completed.map((t, idx) => (
              <li
                key={String(t._id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm text-fg ${
                  idx !== completed.length - 1 ? 'border-b border-line-subtle' : ''
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
                <span className="truncate">{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-md font-semibold text-fg">
          تواصلات اليوم{interactions.length > 0 && ` (${interactions.length})`}
        </h2>
        {interactions.length === 0 ? (
          <p className="text-sm text-fg-secondary">لا تواصلات مسجلة اليوم.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg bg-surface shadow-1">
            {interactions.map((i, idx) => {
              const clinic =
                i.clinicId && typeof i.clinicId === 'object' && 'name' in i.clinicId
                  ? (i.clinicId as { name: string }).name
                  : '—';
              return (
                <li
                  key={String(i._id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm text-fg ${
                    idx !== interactions.length - 1 ? 'border-b border-line-subtle' : ''
                  }`}
                >
                  <span className="text-xs text-fg-tertiary">{i.type}</span>
                  <span className="truncate">
                    {clinic} — {i.summary}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}