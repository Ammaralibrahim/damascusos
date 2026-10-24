import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  Phone,
  Globe,
  MapPin,
  User,
  Share2,
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  TrendingUp,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { Alert, Badge, Card, Empty, Section } from '@/components/ui';
import { StageBadge, FollowUpStateBadge } from '@/components/status-badge';
import { ScoreBadge } from '@/components/score-badge';
import { PageHeader } from '@/components/page-header';
import { requireSession } from '@/lib/auth';
import {
  getClinic,
  getClinicFollowUps,
  getClinicInteractions,
  getClinicTypes,
} from '@/lib/data';
import { scoreClinic } from '@/lib/scoring';
import { getClinicTypeLabel } from '@/lib/clinic-types';
import {
  StageSelector,
  InteractionForm,
  FollowUpForm,
} from './clinic-forms';
import { DeleteClinicButton } from './delete-button';

const TYPE_LABEL: Record<string, string> = {
  call: 'مكالمة',
  message: 'رسالة',
  reply: 'رد',
  meeting: 'اجتماع',
  demo: 'عرض تجريبي',
  quote: 'عرض سعر',
  followup: 'متابعة',
  note: 'ملاحظة',
};

const YES_NO_UNKNOWN_LABEL: Record<string, string> = {
  yes: 'نعم',
  no: 'لا',
  unknown: 'غير معروف',
};

const YES_NO_UNKNOWN_TONE: Record<string, 'ok' | 'bad' | 'neutral'> = {
  yes: 'ok',
  no: 'bad',
  unknown: 'neutral',
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function ClinicDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const clinic = await getClinic(params.id);
  if (!clinic) notFound();

  const [interactions, followUps, clinicTypes] = await Promise.all([
    getClinicInteractions(params.id),
    getClinicFollowUps(params.id),
    getClinicTypes(session.userId),
  ]);

  const score = scoreClinic(clinic.scores);
  const digital = clinic.digital ?? {};

  const nextFollowUp = followUps
    .filter((f) => f.dueAt)
    .sort(
      (a, b) =>
        new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime(),
    )[0];

  const now = new Date();
  const nextFollowUpIsOverdue =
    nextFollowUp?.dueAt != null && new Date(nextFollowUp.dueAt) < now;

  const hasAnyContactInfo = Boolean(
    clinic.phone || clinic.website || clinic.social,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={
          <Link
            href="/clinics"
            className="inline-flex items-center gap-1 text-xs text-fg-tertiary transition-colors duration-fast hover:text-fg"
          >
            <ArrowRight size={12} strokeWidth={1.75} />
            العيادات
          </Link>
        }
        overline="تفاصيل العيادة"
        title={clinic.name}
        description={
          <div className="flex flex-wrap items-center gap-2">
            {clinic.clinicType && (
              <Badge tone="info">
                {getClinicTypeLabel(clinic.clinicType, clinicTypes)}
              </Badge>
            )}
            <StageBadge stage={clinic.stage} />
            <ScoreBadge total={score.total} complete={score.complete} />
            {clinic.area && (
              <span className="inline-flex items-center gap-1 text-xs text-fg-tertiary">
                <MapPin size={12} strokeWidth={1.75} />
                {clinic.area}
                {clinic.city && ` · ${clinic.city}`}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {clinic.website && (
              <a
                href={clinic.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-fg shadow-1 transition-[background-color,border-color,transform] duration-fast hover:bg-surface-2 active:translate-y-px"
              >
                <ExternalLink size={12} strokeWidth={1.75} />
                الموقع
              </a>
            )}
            <Link
              href={`/clinics/${params.id}/edit`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-xs font-medium text-fg shadow-1 transition-[background-color,border-color,transform] duration-fast hover:bg-surface-2 active:translate-y-px"
            >
              <Pencil size={12} strokeWidth={1.75} />
              تعديل
            </Link>
            <DeleteClinicButton clinicId={params.id} clinicName={clinic.name} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat
          icon={<TrendingUp size={16} strokeWidth={1.75} />}
          label="تقييم الفرصة"
          value={score.complete ? `${score.total}/100` : 'غير مكتمل'}
          tone={
            score.complete
              ? score.total >= 70
                ? 'ok'
                : score.total >= 40
                  ? 'warn'
                  : 'bad'
              : 'neutral'
          }
        />
        <MiniStat
          icon={<Clock size={16} strokeWidth={1.75} />}
          label="آخر تواصل"
          value={
            clinic.lastContactAt
              ? formatDateShort(clinic.lastContactAt)
              : 'لم يُسجَّل'
          }
          tone={clinic.lastContactAt ? 'default' : 'neutral'}
        />
        <MiniStat
          icon={<Calendar size={16} strokeWidth={1.75} />}
          label="المتابعة القادمة"
          value={
            nextFollowUp ? formatDateShort(nextFollowUp.dueAt!) : 'لا يوجد'
          }
          tone={
            nextFollowUp
              ? nextFollowUpIsOverdue
                ? 'bad'
                : 'warn'
              : 'neutral'
          }
        />
        <MiniStat
          icon={<FileText size={16} strokeWidth={1.75} />}
          label="سجلات التواصل"
          value={String(interactions.length)}
          tone="default"
        />
      </div>

      {nextFollowUp ? (
        <Card
          className={
            nextFollowUpIsOverdue
              ? 'border-bad/30 bg-bad-bg/30'
              : 'border-warn/30 bg-warn-bg/30'
          }
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                nextFollowUpIsOverdue
                  ? 'bg-bad/15 text-bad'
                  : 'bg-warn/15 text-warn'
              }`}
            >
              <Clock size={18} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-fg-tertiary">
                  المتابعة القادمة
                </span>
                <FollowUpStateBadge
                  state={nextFollowUpIsOverdue ? 'overdue' : 'upcoming'}
                />
              </div>
              <p className="mt-1 text-base font-medium text-fg">
                {nextFollowUp.note}
              </p>
              <p className="mt-0.5 text-xs text-fg-secondary tabular">
                {formatDate(nextFollowUp.dueAt!)}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-2 text-sm text-fg-secondary">
            <CheckCircle2
              size={16}
              strokeWidth={1.75}
              className="text-ok"
            />
            لا توجد متابعة قادمة. أضف متابعة من القسم أدناه عندما تحتاج.
          </div>
        </Card>
      )}

      <Section
        title="مرحلة المبيعات"
        description="تحديث المرحلة الحالية للفرصة"
      >
        <Card padding="md">
          <StageSelector clinicId={params.id} current={clinic.stage} />
          {clinic.lostReason && (
            <div className="mt-3 border-t border-line-subtle pt-3">
              <p className="text-xs text-fg-tertiary">سبب الخسارة</p>
              <p className="mt-1 text-sm text-bad">{clinic.lostReason}</p>
            </div>
          )}
        </Card>
      </Section>

      <Section
        title="معلومات العيادة"
        description="البيانات الأساسية وسبل التواصل"
      >
        <Card>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
            <InfoRow
              icon={<User size={14} strokeWidth={1.75} />}
              label="الطبيب"
              value={clinic.doctorName}
            />
            <InfoRow
              icon={<MapPin size={14} strokeWidth={1.75} />}
              label="المنطقة"
              value={
                clinic.area
                  ? `${clinic.area}${clinic.city ? ` · ${clinic.city}` : ''}`
                  : undefined
              }
            />
            <InfoRow
              icon={<Phone size={14} strokeWidth={1.75} />}
              label="الهاتف"
              value={clinic.phone}
              ltr
              action={
                clinic.phone ? (
                  <a
                    href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface-2 px-2 text-[11px] font-medium text-fg transition-colors duration-fast hover:bg-hover"
                  >
                    <Phone size={11} strokeWidth={2} />
                    اتصال
                  </a>
                ) : undefined
              }
            />
            <InfoRow
              icon={<Globe size={14} strokeWidth={1.75} />}
              label="الموقع"
              value={clinic.website}
              ltr
              action={
                clinic.website ? (
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-surface-2 px-2 text-[11px] font-medium text-fg transition-colors duration-fast hover:bg-hover"
                  >
                    <ExternalLink size={11} strokeWidth={2} />
                    فتح
                  </a>
                ) : undefined
              }
            />
            <InfoRow
              icon={<Share2 size={14} strokeWidth={1.75} />}
              label="التواصل الاجتماعي"
              value={clinic.social}
              ltr
            />
            <InfoRow
              icon={<Tag size={14} strokeWidth={1.75} />}
              label="المصدر"
              value={clinic.source}
            />
            <InfoRow
              icon={<Calendar size={14} strokeWidth={1.75} />}
              label="تاريخ الإضافة"
              value={
                (clinic as { createdAt?: Date }).createdAt
                  ? formatDate((clinic as { createdAt?: Date }).createdAt!)
                  : undefined
              }
            />
          </dl>

          {!hasAnyContactInfo && (
            <div className="mt-4 border-t border-line-subtle pt-3">
              <Alert tone="warn" title="لا توجد وسيلة تواصل">
                أضف رقم هاتف أو موقعًا إلكترونيًا لتتمكن من التواصل مع
                العيادة.
              </Alert>
            </div>
          )}
        </Card>
      </Section>

      <Section
        title="التقييم الرقمي"
        description="جودة الحضور الرقمي الحالي للعيادة"
      >
        <Card>
          <ul className="divide-y divide-line-subtle">
            <DigitalRow
              label="وجود موقع إلكتروني"
              value={digital.hasWebsite ?? 'unknown'}
            />
            <DigitalRow
              label="ملاءمة الموقع للهاتف"
              value={digital.mobileFriendly ?? 'unknown'}
            />
            <DigitalRow
              label="وضوح الخدمات"
              value={digital.servicesClear ?? 'unknown'}
            />
            <DigitalRow
              label="توافر المعلومات الأساسية"
              value={digital.basicInfoPresent ?? 'unknown'}
            />
            <DigitalRow
              label="وسيلة طلب موعد"
              value={digital.bookingPresent ?? 'unknown'}
            />
            <DigitalRow
              label="وضوح وسائل التواصل"
              value={digital.contactClear ?? 'unknown'}
            />
          </ul>

          {(digital.observedIssue || digital.suggestedImprovement) && (
            <div className="mt-4 space-y-3 border-t border-line-subtle pt-4">
              {digital.observedIssue && (
                <div>
                  <p className="text-xs font-medium text-fg-tertiary">
                    المشكلة الملحوظة
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg">
                    {digital.observedIssue}
                  </p>
                </div>
              )}
              {digital.suggestedImprovement && (
                <div>
                  <p className="text-xs font-medium text-fg-tertiary">
                    التحسين المقترح
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg">
                    {digital.suggestedImprovement}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </Section>

      <Section
        title="تقييم فرصة البيع"
        description={
          score.complete
            ? `${score.total} من 100 — مبني على معلومات مُتحقَّق منها`
            : 'التقييم غير مكتمل — بعض المعايير لم تُقيَّم بعد'
        }
        action={
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
              score.complete
                ? 'border-ok/30 bg-ok-bg text-ok'
                : 'border-line bg-subtle text-fg-tertiary'
            }`}
          >
            {score.complete ? (
              <>
                <CheckCircle2 size={11} strokeWidth={2.5} />
                مكتمل
              </>
            ) : (
              <>
                <Circle size={11} strokeWidth={2.5} />
                غير مكتمل
              </>
            )}
          </span>
        }
      >
        <Card>
          <ul className="divide-y divide-line-subtle">
            <ScoreRow
              label="وضوح المشكلة الرقمية"
              score={clinic.scores?.problem ?? 0}
              max={25}
            />
            <ScoreRow
              label="ملاءمة الخدمة للاحتياج"
              score={clinic.scores?.fit ?? 0}
              max={20}
            />
            <ScoreRow
              label="إمكانية الوصول لصاحب القرار"
              score={clinic.scores?.access ?? 0}
              max={15}
            />
            <ScoreRow
              label="وجود اهتمام تجاري فعلي"
              score={clinic.scores?.interest ?? 0}
              max={25}
            />
            <ScoreRow
              label="وضوح الخطوة التالية"
              score={clinic.scores?.nextStep ?? 0}
              max={15}
            />
          </ul>
        </Card>
      </Section>

      <Section
        title="تسجيل تواصل جديد"
        description="أضف مكالمة أو رسالة أو اجتماعًا"
      >
        <Card>
          <InteractionForm clinicId={params.id} />
        </Card>
      </Section>

      <Section
        title={`سجل التواصل (${interactions.length})`}
        description={
          interactions.length === 0
            ? 'لا توجد سجلات بعد'
            : `آخر تواصل ${formatDateShort(interactions[0]?.occurredAt)}`
        }
      >
        {interactions.length === 0 ? (
          <Empty
            icon={<FileText size={20} strokeWidth={1.75} />}
            title="لا تواصلات مسجلة"
            description="سجّل أول مكالمة أو رسالة من النموذج أعلاه."
          />
        ) : (
          <ol className="relative space-y-4 ps-6">
            <span
              className="absolute inset-y-0 end-[7px] w-px bg-line-subtle"
              aria-hidden
            />
            {interactions.map((i) => (
              <li key={String(i._id)} className="relative">
                <span
                  className="absolute -start-6 top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line-strong bg-surface"
                  aria-hidden
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <div className="rounded-lg border border-line-subtle bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">
                      {TYPE_LABEL[i.type] ?? i.type}
                    </Badge>
                    <span className="text-[11px] text-fg-tertiary tabular">
                      {formatDate(i.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-fg">
                    {i.summary}
                  </p>
                  {i.outcome && (
                    <p className="mt-1.5 text-xs text-fg-secondary">
                      <span className="font-medium">النتيجة:</span>{' '}
                      {i.outcome}
                    </p>
                  )}
                  {i.nextStep && (
                    <p className="mt-0.5 text-xs text-fg-secondary">
                      <span className="font-medium">الخطوة التالية:</span>{' '}
                      {i.nextStep}
                    </p>
                  )}
                  {i.followUpAt && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-warn tabular">
                      <Calendar size={11} strokeWidth={1.75} />
                      متابعة مطلوبة: {formatDate(i.followUpAt)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={`المتابعات المفتوحة (${followUps.length})`}>
        {followUps.length === 0 ? (
          <Empty title="لا متابعات مفتوحة" />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line-subtle bg-surface">
            {followUps.map((f, idx) => {
              const isOverdue =
                f.dueAt != null && new Date(f.dueAt) < now;
              return (
                <li
                  key={String(f._id)}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                    idx !== followUps.length - 1
                      ? 'border-b border-line-subtle'
                      : ''
                  }`}
                >
                  <FollowUpStateBadge
                    state={isOverdue ? 'overdue' : 'upcoming'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-fg">
                      {f.note}
                    </div>
                    <div className="mt-0.5 text-[11px] text-fg-tertiary tabular">
                      {f.dueAt ? formatDate(f.dueAt) : 'بدون موعد'}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Card>
          <div className="mb-2 text-sm font-medium text-fg">
            إضافة متابعة جديدة
          </div>
          <FollowUpForm clinicId={params.id} />
        </Card>
      </Section>

      {clinic.notes && (
        <Section title="ملاحظات داخلية">
          <Card>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
              {clinic.notes}
            </p>
          </Card>
        </Section>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'ok' | 'warn' | 'bad' | 'neutral';
}) {
  const tones: Record<string, string> = {
    default: 'text-fg',
    ok: 'text-ok',
    warn: 'text-warn',
    bad: 'text-bad',
    neutral: 'text-fg-tertiary',
  };
  return (
    <div className="rounded-lg border border-line-subtle bg-surface p-3">
      <div className="flex items-center gap-1.5 text-fg-tertiary">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <div
        className={`mt-1 truncate text-base font-semibold tabular ${tones[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  ltr,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  ltr?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1 shrink-0 text-fg-tertiary">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] text-fg-tertiary">{label}</dt>
        <dd
          className={`mt-0.5 truncate text-sm ${
            value ? 'text-fg' : 'text-fg-tertiary'
          }`}
          dir={ltr ? 'ltr' : undefined}
          style={ltr ? { textAlign: 'right' } : undefined}
        >
          {value ?? 'غير متوفر'}
        </dd>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function DigitalRow({ label, value }: { label: string; value: string }) {
  const tone = YES_NO_UNKNOWN_TONE[value] ?? 'neutral';
  const labelText = YES_NO_UNKNOWN_LABEL[value] ?? value;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-fg">{label}</span>
      <Badge tone={tone}>{labelText}</Badge>
    </li>
  );
}

function ScoreRow({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const tone = pct >= 70 ? 'bg-ok' : pct >= 40 ? 'bg-warn' : 'bg-bad';
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-fg">{label}</span>
        <span className="text-xs font-medium text-fg-secondary tabular">
          {score} / {max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle">
        <div
          className={`h-full rounded-full ${tone} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}