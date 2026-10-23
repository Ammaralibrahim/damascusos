import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Inbox, Sparkles } from 'lucide-react';
import { Button, Card, Empty, Section, StatCard } from '@/components/ui';
import { PriorityBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { requireSession } from '@/lib/auth';
import { getSettings, todayTasks, openFollowUps } from '@/lib/data';
import { computeNextSteps } from '@/lib/next-step';

export default async function DashboardPage() {
  const session = await requireSession();
  const [settings, tasks, follows, nextSteps] = await Promise.all([
    getSettings(session.userId),
    todayTasks(),
    openFollowUps(),
    computeNextSteps(),
  ]);
  const nextStep = nextSteps[0];
  const top3 = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').slice(0, 3);
  const overdue = follows.filter((f) => f.state === 'overdue');

  return (
    <div className="space-y-8">
      <PageHeader
        overline="مساحة العمل"
        title={`مرحبًا، ${settings.displayName}`}
        description={`${settings.projectName} · ${settings.defaultMarket}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="مهام اليوم" value={top3.length} tone="default" />
        <StatCard label="متابعات متأخرة" value={overdue.length} tone={overdue.length > 0 ? 'bad' : 'ok'} />
        <StatCard label="مفتوحة" value={follows.length} tone="accent" />
      </div>

      {/* Next Step — البطاقة الأهم */}
      <section
        aria-labelledby="next-step-title"
        className="rounded-xl border border-accent/20 bg-gradient-to-b from-accent-soft to-surface p-5 md:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-fg-inverse shadow-1">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-accent">الخطوة التالية</p>
            <h2 id="next-step-title" className="mt-1 text-lg font-medium text-fg">
              {nextStep?.action ?? 'لا توجد خطوة عاجلة الآن'}
            </h2>
            {nextStep && (
              <p className="mt-1 text-sm text-fg-secondary">{nextStep.reason}</p>
            )}
            {nextStep && (
              <div className="mt-4">
                <Link
                  href={nextStep.href}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-fg-inverse shadow-1 transition-[background-color,transform] duration-fast hover:bg-accent-hover active:translate-y-px"
                >
                  افتح
                  <ArrowLeft size={14} strokeWidth={2} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tasks */}
      <Section
        title="مهام اليوم"
        description={`${top3.length} مهام نشطة`}
        action={
          <Link
            href="/today"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-line bg-surface-2 px-3 text-xs font-medium text-fg shadow-1 transition-colors duration-fast hover:bg-hover"
          >
            الكل
            <ArrowLeft size={12} strokeWidth={2} />
          </Link>
        }
      >
        {top3.length === 0 ? (
          <Empty
            icon={<CheckCircle2 size={20} strokeWidth={1.75} />}
            title="لا مهام مجدولة"
            description="أضف مهمة واحدة على الأقل لتبدأ يومك."
            action={
              <Link href="/today">
                <Button variant="primary" size="sm">
                  فتح يومي
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
            {top3.map((t, idx) => (
              <li
                key={String(t._id)}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx !== top3.length - 1 ? 'border-b border-line-subtle' : ''
                }`}
              >
                <PriorityBadge priority={t.priority} />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{t.title}</span>
                {t.estimatedMinutes ? (
                  <span className="inline-flex items-center gap-1 text-xs text-fg-tertiary tabular">
                    <Clock size={12} strokeWidth={1.75} />
                    {t.estimatedMinutes} د
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Follow-ups */}
      <Section
        title="متابعات متأخرة"
        description={overdue.length === 0 ? 'لا شيء متأخر' : `${overdue.length} عنصر يحتاج انتباهك`}
      >
        {overdue.length === 0 ? (
          <Card padding="sm">
            <div className="flex items-center gap-2 text-sm text-fg-secondary">
              <CheckCircle2 size={16} strokeWidth={1.75} className="text-ok" />
              كل المتابعات على المسار.
            </div>
          </Card>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
            {overdue.slice(0, 5).map((f, idx) => {
              const clinic =
                f.clinicId && typeof f.clinicId === 'object' && 'name' in f.clinicId
                  ? (f.clinicId as { name: string })
                  : null;
              return (
                <li
                  key={String(f._id)}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx !== Math.min(overdue.length, 5) - 1 ? 'border-b border-line-subtle' : ''
                  }`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bad" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{f.note}</span>
                  {clinic && (
                    <span className="hidden shrink-0 text-xs text-fg-tertiary sm:inline">
                      {clinic.name}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Quick Actions */}
      <Section title="إجراءات سريعة" divided>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <QuickAction href="/clinics/new" icon={<Inbox size={16} strokeWidth={1.75} />} label="إضافة عيادة" />
          <QuickAction href="/clinics" icon={<Inbox size={16} strokeWidth={1.75} />} label="عرض العيادات" />
          <QuickAction href="/followups" icon={<Clock size={16} strokeWidth={1.75} />} label="إدارة المتابعات" />
        </div>
      </Section>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-3 text-sm text-fg shadow-1 transition-[background-color,border-color,transform] duration-fast hover:border-line-strong hover:bg-hover active:translate-y-px"
    >
      <span className="text-fg-tertiary">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}