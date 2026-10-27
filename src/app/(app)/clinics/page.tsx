import Link from 'next/link';
import { ArrowLeft, Clock, FileText, Send, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Badge, Button, Card, Empty, Section, StatCard } from '@/components/ui';
import { PriorityBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { requireSession } from '@/lib/auth';
import { getSettings, todayTasks, openFollowUps } from '@/lib/data';
import { computeNextSteps } from '@/lib/next-step';
import { getDashboardMetrics } from '@/lib/metrics';
import type { TodayTask, OpenFollowUp, SettingsResult } from '@/lib/data';
import type { Suggestion } from '@/lib/next-step';

export default async function DashboardPage() {
  const session = await requireSession();

  const [settings, tasks, follows, nextSteps, metrics]: [
    SettingsResult,
    TodayTask[],
    OpenFollowUp[],
    Suggestion[],
    Awaited<ReturnType<typeof getDashboardMetrics>>,
  ] = await Promise.all([
    getSettings(session.userId),
    todayTasks(),
    openFollowUps(),
    computeNextSteps(),
    getDashboardMetrics(),
  ]);

  const nextStep = nextSteps[0];
  const top3 = tasks
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    .slice(0, 3);
  const overdue = follows.filter((f) => f.state === 'overdue');

  return (
    <div className="space-y-8">
      <PageHeader
        overline="مساحة العمل"
        title={`مرحبًا، ${settings.displayName}`}
        description={`${settings.projectName} · ${settings.defaultMarket}`}
      />

      {/* KPIs — 6 مؤشرات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="عيادات نشطة"
          value={metrics.activeClinics}
          tone="accent"
        />
        <StatCard
          label="رسائل مُسجَّلة"
          value={metrics.outreachCount}
          tone="default"
        />
        <StatCard
          label="مهتمة"
          value={metrics.interested}
          tone="ok"
        />
        <StatCard
          label="نماذج قيد التجهيز"
          value={metrics.demoPreparing}
          tone="warn"
        />
        <StatCard
          label="نماذج مُرسَلة"
          value={metrics.demoShared}
          tone="default"
        />
        <StatCard
          label="عملاء مدفوعون"
          value={metrics.paid}
          tone="ok"
        />
      </div>

      {/* مؤشرات التحويل */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-fg-tertiary">تحويل إلى اهتمام</div>
              <div className="mt-1 text-2xl font-semibold tabular text-fg">
                {metrics.hasEnoughDataForRates && metrics.conversionToInterest != null
                  ? `${metrics.conversionToInterest}%`
                  : '—'}
              </div>
              {!metrics.hasEnoughDataForRates && (
                <div className="mt-0.5 text-[11px] text-fg-tertiary">
                  يحتاج 5 عينات على الأقل
                </div>
              )}
            </div>
            <TrendingUp size={18} className="text-accent" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-fg-tertiary">تحويل إلى مدفوع</div>
              <div className="mt-1 text-2xl font-semibold tabular text-fg">
                {metrics.hasEnoughDataForRates && metrics.conversionToPaid != null
                  ? `${metrics.conversionToPaid}%`
                  : '—'}
              </div>
              {!metrics.hasEnoughDataForRates && (
                <div className="mt-0.5 text-[11px] text-fg-tertiary">
                  يحتاج 5 عينات على الأقل
                </div>
              )}
            </div>
            <Users size={18} className="text-accent" />
          </div>
        </Card>
      </div>

      {/* المتابعات المتأخرة — أولوية قصوى */}
      {overdue.length > 0 && (
        <Section
          title="متابعات متأخرة"
          description={`${overdue.length} عنصر يحتاج انتباهك فورًا`}
        >
          <ul className="overflow-hidden rounded-lg border border-bad/30 bg-bad-bg/20">
            {overdue.slice(0, 5).map((f, idx) => {
              const clinic =
                f.clinicId && typeof f.clinicId === 'object' && 'name' in f.clinicId
                  ? (f.clinicId as { name: string; _id?: string })
                  : null;
              return (
                <li
                  key={f._id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx !== Math.min(overdue.length, 5) - 1
                      ? 'border-b border-line-subtle'
                      : ''
                  }`}
                >
                  <Clock size={14} className="shrink-0 text-bad" />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">
                    {f.note}
                  </span>
                  {clinic && (
                    <span className="hidden shrink-0 text-xs text-fg-secondary sm:inline">
                      {clinic.name}
                    </span>
                  )}
                  <Link
                    href="/followups"
                    className="shrink-0 text-xs font-medium text-bad underline-offset-2 hover:underline"
                  >
                    فتح
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* الخطوة التالية */}
      <section
        aria-labelledby="next-step-title"
        className="rounded-xl border border-accent/20 bg-gradient-to-b from-accent-soft to-surface p-5 md:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-fg-inverse shadow-1">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-accent">
              الخطوة التالية
            </p>
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

      {/* مهام اليوم */}
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
            icon={<FileText size={20} strokeWidth={1.75} />}
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
                key={t._id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx !== top3.length - 1 ? 'border-b border-line-subtle' : ''
                }`}
              >
                <PriorityBadge priority={t.priority} />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">
                  {t.title}
                </span>
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

      {/* إجراءات سريعة */}
      <Section title="إجراءات سريعة" divided>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <QuickAction
            href="/clinics/new"
            icon={<Send size={16} strokeWidth={1.75} />}
            label="عيادة جديدة"
          />
          <QuickAction
            href="/clinics"
            icon={<Users size={16} strokeWidth={1.75} />}
            label="كل العيادات"
          />
          <QuickAction
            href="/followups"
            icon={<Clock size={16} strokeWidth={1.75} />}
            label="المتابعات"
          />
        </div>
      </Section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
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