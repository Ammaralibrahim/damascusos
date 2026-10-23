import 'server-only';
import { connectDb } from './db';
import { ClinicModel } from '@/models/Clinic';
import { TaskModel } from '@/models/Task';
import { FollowUpModel } from '@/models/FollowUp';
import { UserModel } from '@/models/User';
import { InteractionModel } from '@/models/Interaction';
import { FocusSessionModel } from '@/models/FocusSession';
import { DailyReviewModel } from '@/models/DailyReview';
import { normalizePhone } from './phone';
import type { ClinicDoc } from '@/models/Clinic';

/* ============================================================
   Types — صريحة بالكامل
   ============================================================ */
export type ClinicListItem = {
  _id: string;
  name: string;
  doctorName?: string;
  city?: string;
  area?: string;
  phone?: string;
  phoneNormalized?: string;
  website?: string;
  social?: string;
  source?: string;
  stage:
    | 'new'
    | 'verifying'
    | 'qualified'
    | 'contacted'
    | 'awaiting_reply'
    | 'initial_interest'
    | 'discussing'
    | 'demo'
    | 'quote'
    | 'negotiation'
    | 'won'
    | 'paid'
    | 'not_interested'
    | 'future_followup';
  lostReason?: string;
  lastContactAt?: Date | null;
  notes?: string;
  digital?: {
    hasWebsite?: 'yes' | 'no' | 'unknown';
    mobileFriendly?: 'yes' | 'no' | 'unknown';
    servicesClear?: 'yes' | 'no' | 'unknown';
    basicInfoPresent?: 'yes' | 'no' | 'unknown';
    bookingPresent?: 'yes' | 'no' | 'unknown';
    contactClear?: 'yes' | 'no' | 'unknown';
    observedIssue?: string;
    suggestedImprovement?: string;
  };
  scores?: {
    problem?: number;
    fit?: number;
    access?: number;
    interest?: number;
    nextStep?: number;
    complete?: boolean;
  };
};

export type OpenFollowUp = {
  _id: string;
  note: string;
  dueAt: Date | null;
  status: 'open' | 'done' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
  clinicId?: string | { _id: string; name: string } | null;
  state: 'unscheduled' | 'overdue' | 'upcoming';
};

export type TodayTask = {
  _id: string;
  title: string;
  description: string | null;
  kind: 'research' | 'outreach' | 'dev' | 'admin' | 'learning' | 'review';
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done' | 'postponed' | 'cancelled';
  estimatedMinutes: number | null;
  scheduledFor: Date | null;
  deadline: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CompletedTask = {
  _id: string;
  title: string;
  completedAt: Date | null;
};

export type TodayInteraction = {
  _id: string;
  type:
    | 'call'
    | 'message'
    | 'reply'
    | 'meeting'
    | 'demo'
    | 'quote'
    | 'followup'
    | 'note';
  summary: string;
  occurredAt: Date;
  clinicId?: string | { _id: string; name: string } | null;
};

export type TodayReviewResult = {
  _id: string;
  obstacle: string;
  nextStep: string;
  notes: string;
  date: Date;
};

export type ActiveFocusSessionResult = {
  _id: string;
  taskId: string;
  startedAt: Date;
} | null;

export type SettingsResult = {
  displayName: string;
  projectName: string;
  defaultSector: string;
  defaultMarket: string;
  mainService: string;
  workStartHour: number;
  workEndHour: number;
  workDays: number[];
  timezone: string;
  currency: string;
  weeklyOutreachGoal: number;
  demoTimeLimitMinutes: number;
  inAppNotifications: boolean;
};

/* ============================================================
   Settings
   ============================================================ */
export async function getSettings(userId: string): Promise<SettingsResult> {
  await connectDb();
  const u = await UserModel.findById(userId).lean();
  if (!u) throw new Error('المستخدم غير موجود');
  const doc = u as unknown as {
    settings?: Partial<SettingsResult>;
  };
  const s = doc.settings ?? {};
  return {
    displayName: s.displayName ?? 'عمار',
    projectName: s.projectName ?? 'Damascus.webp',
    defaultSector: s.defaultSector ?? 'عيادات الأسنان',
    defaultMarket: s.defaultMarket ?? 'دمشق',
    mainService: s.mainService ?? 'موقع احترافي سريع ومتجاوب للعيادة',
    workStartHour: s.workStartHour ?? 9,
    workEndHour: s.workEndHour ?? 17,
    workDays: s.workDays ?? [0, 1, 2, 3, 4],
    timezone: s.timezone ?? 'Asia/Damascus',
    currency: s.currency ?? 'SYP',
    weeklyOutreachGoal: s.weeklyOutreachGoal ?? 10,
    demoTimeLimitMinutes: s.demoTimeLimitMinutes ?? 240,
    inAppNotifications: s.inAppNotifications ?? true,
  };
}

/* ============================================================
   Clinics
   ============================================================ */
function toClinicListItem(raw: unknown): ClinicListItem {
  const c = raw as {
    _id: unknown;
    name: string;
    doctorName?: string;
    city?: string;
    area?: string;
    phone?: string;
    phoneNormalized?: string;
    website?: string;
    social?: string;
    source?: string;
    stage: ClinicListItem['stage'];
    lostReason?: string;
    lastContactAt?: Date | null;
    notes?: string;
    digital?: ClinicListItem['digital'];
    scores?: ClinicListItem['scores'];
  };
  return {
    _id: String(c._id),
    name: c.name,
    doctorName: c.doctorName,
    city: c.city,
    area: c.area,
    phone: c.phone,
    phoneNormalized: c.phoneNormalized,
    website: c.website,
    social: c.social,
    source: c.source,
    stage: c.stage,
    lostReason: c.lostReason,
    lastContactAt: c.lastContactAt ?? null,
    notes: c.notes,
    digital: c.digital,
    scores: c.scores,
  };
}

export async function listClinics(
  params: { q?: string; stage?: string } = {},
): Promise<ClinicListItem[]> {
  await connectDb();
  const filter: Record<string, unknown> = {};
  if (params.stage) filter.stage = params.stage;
  if (params.q) {
    const escaped = params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    const phoneNorm = normalizePhone(params.q);
    const or: Record<string, unknown>[] = [
      { name: rx },
      { area: rx },
      { website: rx },
    ];
    if (phoneNorm) or.push({ phoneNormalized: phoneNorm });
    filter.$or = or;
  }
  const list = await ClinicModel.find(filter)
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();
  return (list as unknown[]).map(toClinicListItem);
}

export async function getClinic(id: string): Promise<ClinicListItem | null> {
  await connectDb();
  const doc = await ClinicModel.findById(id).lean();
  if (!doc) return null;
  if (Array.isArray(doc)) {
    const first = doc[0];
    return first ? toClinicListItem(first) : null;
  }
  return toClinicListItem(doc);
}

export async function findDuplicateCandidates(input: {
  phone?: string;
  name?: string;
  area?: string;
  website?: string;
}): Promise<
  Array<{ _id: string; name: string; area?: string; phone?: string; stage: string }>
> {
  await connectDb();
  const or: Record<string, unknown>[] = [];
  if (input.phone) {
    const n = normalizePhone(input.phone);
    if (n) or.push({ phoneNormalized: n });
  }
  if (input.website) or.push({ website: input.website });
  if (input.name && input.area) {
    or.push({ name: input.name.trim(), area: input.area.trim() });
  }
  if (!or.length) return [];
  const list = await ClinicModel.find({ $or: or })
    .select('_id name area phone stage')
    .limit(5)
    .lean();
  const rows = list as unknown as Array<{
    _id: unknown;
    name: string;
    area?: string;
    phone?: string;
    stage: string;
  }>;
  return rows.map((d) => ({
    _id: String(d._id),
    name: d.name,
    area: d.area,
    phone: d.phone,
    stage: d.stage,
  }));
}

export async function getClinicInteractions(clinicId: string) {
  await connectDb();
  const list = await InteractionModel.find({ clinicId })
    .sort({ occurredAt: -1 })
    .lean();
  const rows = list as unknown as Array<{
    _id: unknown;
    clinicId: unknown;
    type: TodayInteraction['type'];
    occurredAt: Date;
    summary: string;
    outcome?: string;
    nextStep?: string;
    followUpAt?: Date;
  }>;
  return rows.map((i) => ({
    _id: String(i._id),
    clinicId: String(i.clinicId),
    type: i.type,
    occurredAt: i.occurredAt,
    summary: i.summary,
    outcome: i.outcome,
    nextStep: i.nextStep,
    followUpAt: i.followUpAt,
  }));
}

export async function getClinicFollowUps(clinicId: string) {
  await connectDb();
  const list = await FollowUpModel.find({ clinicId, status: 'open' })
    .sort({ dueAt: 1 })
    .lean();
  const rows = list as unknown as Array<{
    _id: unknown;
    note: string;
    dueAt?: Date | null;
    status: 'open' | 'done' | 'cancelled';
  }>;
  return rows.map((f) => ({
    _id: String(f._id),
    note: f.note,
    dueAt: f.dueAt ?? null,
    status: f.status,
  }));
}

/* ============================================================
   Tasks
   ============================================================ */
export async function todayTasks(): Promise<TodayTask[]> {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const list = await TaskModel.find({
    status: { $in: ['todo', 'in_progress', 'postponed'] },
    $or: [
      { scheduledFor: { $gte: start, $lt: end } },
      { scheduledFor: { $exists: false } },
      { scheduledFor: { $lt: start } },
    ],
  })
    .sort({ priority: -1, scheduledFor: 1, createdAt: 1 })
    .lean();

  const rows = list as unknown as Array<{
    _id: unknown;
    title: string;
    description?: string | null;
    kind?: TodayTask['kind'];
    priority?: TodayTask['priority'];
    status?: TodayTask['status'];
    estimatedMinutes?: number | null;
    scheduledFor?: Date | null;
    deadline?: Date | null;
    completedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }>;

  return rows.map((t) => ({
    _id: String(t._id),
    title: t.title,
    description: t.description ?? null,
    kind: t.kind ?? 'admin',
    priority: t.priority ?? 'medium',
    status: t.status ?? 'todo',
    estimatedMinutes: t.estimatedMinutes ?? null,
    scheduledFor: t.scheduledFor ?? null,
    deadline: t.deadline ?? null,
    completedAt: t.completedAt ?? null,
    createdAt: t.createdAt ?? new Date(),
    updatedAt: t.updatedAt ?? new Date(),
  }));
}

/* ============================================================
   Follow-ups
   ============================================================ */
export async function openFollowUps(): Promise<OpenFollowUp[]> {
  await connectDb();
  const now = new Date();
  const list = await FollowUpModel.find({ status: 'open' })
    .sort({ dueAt: 1 })
    .populate('clinicId', 'name')
    .lean();

  const rows = list as unknown as Array<{
    _id: unknown;
    note: string;
    dueAt?: Date | null;
    status: 'open' | 'done' | 'cancelled';
    createdAt?: Date;
    updatedAt?: Date;
    clinicId?: unknown;
  }>;

  return rows.map((f) => {
    const dueAt = f.dueAt ?? null;
    const state: OpenFollowUp['state'] = !dueAt
      ? 'unscheduled'
      : dueAt <= now
      ? 'overdue'
      : 'upcoming';

    return {
      _id: String(f._id),
      note: f.note,
      dueAt,
      status: f.status,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      clinicId: f.clinicId as OpenFollowUp['clinicId'],
      state,
    };
  });
}

/* ============================================================
   Focus Sessions
   ============================================================ */
export async function activeFocusSession(
  userId: string,
): Promise<ActiveFocusSessionResult> {
  await connectDb();
  const doc = await FocusSessionModel.findOne({
    userId,
    endedAt: { $exists: false },
  })
    .sort({ startedAt: -1 })
    .lean();
  if (!doc) return null;
  const d = doc as unknown as {
    _id: unknown;
    taskId: unknown;
    startedAt: Date;
  };
  return {
    _id: String(d._id),
    taskId: String(d.taskId),
    startedAt: d.startedAt,
  };
}

export async function focusSessionsForTask(taskId: string) {
  await connectDb();
  return FocusSessionModel.find({
    taskId,
    endedAt: { $exists: true },
  })
    .sort({ startedAt: -1 })
    .lean();
}

/* ============================================================
   Reviews
   ============================================================ */
export async function todayReview(
  userId: string,
): Promise<TodayReviewResult | null> {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const doc = await DailyReviewModel.findOne({
    userId,
    date: { $gte: start, $lt: end },
  }).lean();
  if (!doc) return null;
  const d = doc as unknown as {
    _id: unknown;
    obstacle?: string;
    nextStep?: string;
    notes?: string;
    date: Date;
  };
  return {
    _id: String(d._id),
    obstacle: d.obstacle ?? '',
    nextStep: d.nextStep ?? '',
    notes: d.notes ?? '',
    date: d.date,
  };
}

export async function todayCompletedTasks(): Promise<CompletedTask[]> {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const list = await TaskModel.find({
    status: 'done',
    completedAt: { $gte: start, $lt: end },
  })
    .sort({ completedAt: -1 })
    .lean();
  const rows = list as unknown as Array<{
    _id: unknown;
    title: string;
    completedAt?: Date | null;
  }>;
  return rows.map((t) => ({
    _id: String(t._id),
    title: t.title,
    completedAt: t.completedAt ?? null,
  }));
}

export async function todayInteractions(): Promise<TodayInteraction[]> {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const list = await InteractionModel.find({
    occurredAt: { $gte: start, $lt: end },
  })
    .sort({ occurredAt: -1 })
    .populate('clinicId', 'name')
    .lean();
  const rows = list as unknown as Array<{
    _id: unknown;
    type: TodayInteraction['type'];
    summary: string;
    occurredAt: Date;
    clinicId?: unknown;
  }>;
  return rows.map((i) => ({
    _id: String(i._id),
    type: i.type,
    summary: i.summary,
    occurredAt: i.occurredAt,
    clinicId: i.clinicId as TodayInteraction['clinicId'],
  }));
}