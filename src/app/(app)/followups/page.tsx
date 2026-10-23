import Link from 'next/link';
import { Card, Empty } from '@/components/ui';
import { FollowUpStateBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { openFollowUps } from '@/lib/data';
import { FollowUpActions } from './followup-actions';

export default async function FollowUpsPage() {
  const follows = await openFollowUps();
  const overdue = follows.filter((f) => f.state === 'overdue');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const today = follows.filter(
    (f) => f.state === 'upcoming' && f.dueAt && f.dueAt >= todayStart && f.dueAt < todayEnd,
  );
  const later = follows.filter((f) => f.state === 'upcoming' && (!f.dueAt || f.dueAt >= todayEnd));
  const unscheduled = follows.filter((f) => f.state === 'unscheduled');

  function Group({
    title,
    description,
    list,
    stateKey,
  }: {
    title: string;
    description?: string;
    list: typeof follows;
    stateKey: string;
  }) {
    return (
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2 border-b border-line-subtle pb-2">
          <div>
            <h2 className="text-md font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-fg-secondary">{description}</p>}
          </div>
          <span className="text-xs text-fg-tertiary tabular">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-fg-secondary">—</p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
            {list.map((f, idx) => {
              const clinic =
                f.clinicId && typeof f.clinicId === 'object' && 'name' in f.clinicId
                  ? (f.clinicId as { name: string; _id: string })
                  : null;
              return (
                <li
                  key={String(f._id)}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                    idx !== list.length - 1 ? 'border-b border-line-subtle' : ''
                  }`}
                >
                  <FollowUpStateBadge state={stateKey} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-fg">{f.note}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-tertiary">
                      {clinic && (
                        <Link
                          href={`/clinics/${clinic._id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {clinic.name}
                        </Link>
                      )}
                      {f.dueAt && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="tabular">{new Date(f.dueAt).toLocaleString('ar-SY')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <FollowUpActions id={String(f._id)} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        overline="المتابعات"
        title="ما يحتاج انتباهك"
        description={follows.length === 0 ? 'لا متابعات مفتوحة' : `${follows.length} متابعة`}
      />

      {overdue.length > 0 && (
        <Group title="متأخرة" list={overdue} stateKey="overdue" />
      )}
      <Group title="اليوم" list={today} stateKey="today" />
      <Group title="مجدولة لاحقًا" list={later} stateKey="upcoming" />
      <Group title="بدون موعد" list={unscheduled} stateKey="unscheduled" />

      {follows.length === 0 && (
        <Empty
          title="لا متابعات"
          description="المتابعات تُنشأ من صفحة عيادة أو من مهمة."
        />
      )}
    </div>
  );
}