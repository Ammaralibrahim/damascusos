import { Badge } from './ui';

/* ============================================================
   STAGE
   ============================================================ */
const STAGE_LABEL: Record<string, string> = {
  new: 'جديدة',
  verifying: 'قيد التحقق',
  qualified: 'مؤهلة',
  contacted: 'تم التواصل',
  awaiting_reply: 'بانتظار الرد',
  initial_interest: 'اهتمام مبدئي',
  discussing: 'مناقشة',
  demo: 'عرض تجريبي',
  quote: 'عرض سعر',
  negotiation: 'تفاوض',
  won: 'اتفاق',
  paid: 'مدفوع',
  not_interested: 'غير مهتم',
  future_followup: 'متابعة مستقبلية',
};

type StageTone = 'info' | 'primary' | 'accent' | 'warn' | 'ok' | 'bad' | 'neutral';

const STAGE_TONE: Record<string, StageTone> = {
  new: 'info',
  verifying: 'primary',
  qualified: 'accent',
  contacted: 'info',
  awaiting_reply: 'warn',
  initial_interest: 'accent',
  discussing: 'primary',
  demo: 'primary',
  quote: 'warn',
  negotiation: 'warn',
  won: 'ok',
  paid: 'ok',
  not_interested: 'bad',
  future_followup: 'neutral',
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge tone={STAGE_TONE[stage] ?? 'neutral'}>
      {STAGE_LABEL[stage] ?? stage}
    </Badge>
  );
}

/* ============================================================
   TASK STATUS
   ============================================================ */
const TASK_STATUS_LABEL: Record<string, string> = {
  todo: 'لم تبدأ',
  in_progress: 'قيد التنفيذ',
  done: 'مكتملة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

const TASK_STATUS_TONE: Record<string, 'neutral' | 'primary' | 'ok' | 'warn' | 'bad'> = {
  todo: 'neutral',
  in_progress: 'primary',
  done: 'ok',
  postponed: 'warn',
  cancelled: 'bad',
};

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={TASK_STATUS_TONE[status] ?? 'neutral'}>
      {TASK_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

/* ============================================================
   PRIORITY
   ============================================================ */
const PRIORITY_LABEL: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
};
const PRIORITY_TONE: Record<string, 'neutral' | 'warn' | 'bad'> = {
  low: 'neutral',
  medium: 'warn',
  high: 'bad',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority] ?? 'neutral'}>
      {PRIORITY_LABEL[priority] ?? priority}
    </Badge>
  );
}

/* ============================================================
   FOLLOWUP STATE
   ============================================================ */
const FOLLOWUP_STATE_LABEL: Record<string, string> = {
  overdue: 'متأخرة',
  today: 'اليوم',
  upcoming: 'قادمة',
  unscheduled: 'بدون موعد',
  done: 'مكتملة',
};

const FOLLOWUP_STATE_TONE: Record<
  string,
  'bad' | 'warn' | 'primary' | 'neutral' | 'ok'
> = {
  overdue: 'bad',
  today: 'warn',
  upcoming: 'primary',
  unscheduled: 'neutral',
  done: 'ok',
};

export function FollowUpStateBadge({ state }: { state: string }) {
  return (
    <Badge tone={FOLLOWUP_STATE_TONE[state] ?? 'neutral'}>
      {FOLLOWUP_STATE_LABEL[state] ?? state}
    </Badge>
  );
}