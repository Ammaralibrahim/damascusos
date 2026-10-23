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

export async function getSettings(userId: string) {
  await connectDb();
  const u = await UserModel.findById(userId).lean();
  if (!u) throw new Error('المستخدم غير موجود');
  return u.settings;
}

export async function listClinics(params: { q?: string; stage?: string } = {}) {
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
  return ClinicModel.find(filter).sort({ updatedAt: -1 }).limit(200).lean();
}

export async function getClinic(id: string) {
  await connectDb();
  return ClinicModel.findById(id).lean();
}

export async function findDuplicateCandidates(input: {
  phone?: string;
  name?: string;
  area?: string;
  website?: string;
}) {
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
  return ClinicModel.find({ $or: or }).select('_id name area phone stage').limit(5).lean();
}

export async function getClinicInteractions(clinicId: string) {
  await connectDb();
  return InteractionModel.find({ clinicId }).sort({ occurredAt: -1 }).lean();
}

export async function getClinicFollowUps(clinicId: string) {
  await connectDb();
  return FollowUpModel.find({ clinicId, status: 'open' }).sort({ dueAt: 1 }).lean();
}

/**
 * مهام اليوم.
 *
 * يعرض:
 * - مهام مجدولة اليوم.
 * - مهام بدون تاريخ.
 * - مهام متأخرة من أيام سابقة (لم تُنجز بعد).
 *
 * ملاحظة: الترتيب يعطي الأولوية للمهام المتأخرة ثم المتوسطة ثم الحديثة.
 */
export async function todayTasks() {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return TaskModel.find({
    status: { $in: ['todo', 'in_progress', 'postponed'] },
    $or: [
      { scheduledFor: { $gte: start, $lt: end } }, // اليوم
      { scheduledFor: { $exists: false } },        // بدون تاريخ
      { scheduledFor: { $lt: start } },            // ✅ متأخرة
    ],
  })
    .sort({ priority: -1, scheduledFor: 1, createdAt: 1 })
    .lean();
}

export async function openFollowUps() {
  await connectDb();
  const now = new Date();
  const list = await FollowUpModel.find({ status: 'open' })
    .sort({ dueAt: 1 })
    .populate('clinicId', 'name')
    .lean();
  return list.map((f) => ({
    ...f,
    state: !f.dueAt
      ? ('unscheduled' as const)
      : f.dueAt <= now
      ? ('overdue' as const)
      : ('upcoming' as const),
  }));
}

export async function activeFocusSession(userId: string) {
  await connectDb();
  return FocusSessionModel.findOne({
    userId,
    endedAt: { $exists: false },
  })
    .sort({ startedAt: -1 })
    .lean();
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

export async function todayReview(userId: string) {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return DailyReviewModel.findOne({
    userId,
    date: { $gte: start, $lt: end },
  }).lean();
}

export async function todayCompletedTasks() {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return TaskModel.find({
    status: 'done',
    completedAt: { $gte: start, $lt: end },
  })
    .sort({ completedAt: -1 })
    .lean();
}

export async function todayInteractions() {
  await connectDb();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return InteractionModel.find({
    occurredAt: { $gte: start, $lt: end },
  })
    .sort({ occurredAt: -1 })
    .populate('clinicId', 'name')
    .lean();
}