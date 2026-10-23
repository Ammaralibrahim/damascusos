'use server';

import { revalidatePath } from 'next/cache';
import { connectDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { TaskCreateSchema, ReviewSchema } from '@/schemas';
import { TaskModel } from '@/models/Task';
import { FocusSessionModel } from '@/models/FocusSession';
import { DailyReviewModel } from '@/models/DailyReview';
import { ClinicModel } from '@/models/Clinic';
import { AppError, toUserMessage } from '@/lib/errors';

export type Result = { ok: true } | { ok: false; error: string };

const ALLOWED: Record<string, string[]> = {
  todo: ['in_progress', 'postponed', 'cancelled'],
  in_progress: ['done', 'postponed', 'cancelled'],
  done: [],
  postponed: ['todo', 'cancelled'],
  cancelled: [],
};

export async function createTaskAction(form: FormData): Promise<Result> {
  await requireSession();
  const raw = Object.fromEntries(form.entries());
  const parsed = TaskCreateSchema.safeParse({
    ...raw,
    deadline: raw.deadline || undefined,
    scheduledFor: raw.scheduledFor || undefined,
    estimatedMinutes: raw.estimatedMinutes || undefined,
    clinicId: raw.clinicId || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  try {
    await connectDb();
    if (parsed.data.clinicId) {
      const exists = await ClinicModel.exists({ _id: parsed.data.clinicId });
      if (!exists) throw new AppError('العيادة المرتبطة غير موجودة', 'NOT_FOUND', 404);
    }
    await TaskModel.create(parsed.data);
    revalidatePath('/today');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function transitionTaskAction(taskId: string, next: string): Promise<Result> {
  await requireSession();
  try {
    await connectDb();
    const task = await TaskModel.findById(taskId);
    if (!task) throw new AppError('المهمة غير موجودة', 'NOT_FOUND', 404);
    const allowed = ALLOWED[task.status] ?? [];
    if (!allowed.includes(next)) {
      throw new AppError(
        `لا يمكن الانتقال من "${task.status}" إلى "${next}"`,
        'BAD_TRANSITION',
      );
    }
    task.status = next as typeof task.status;
    if (next === 'done') task.completedAt = new Date();
    await task.save();
    revalidatePath('/today');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function startFocusSessionAction(taskId: string): Promise<Result> {
  const session = await requireSession();
  try {
    await connectDb();
    const existing = await FocusSessionModel.findOne({
      userId: session.userId,
      endedAt: { $exists: false },
    });
    if (existing) throw new AppError('توجد جلسة تركيز جارية بالفعل.', 'ALREADY_OPEN');
    const task = await TaskModel.findById(taskId);
    if (!task) throw new AppError('المهمة غير موجودة', 'NOT_FOUND', 404);
    await FocusSessionModel.create({
      userId: session.userId,
      taskId,
      startedAt: new Date(),
    });
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function stopFocusSessionAction(sessionId: string): Promise<Result> {
  const session = await requireSession();
  try {
    await connectDb();
    const fs = await FocusSessionModel.findOne({
      _id: sessionId,
      userId: session.userId,
      endedAt: { $exists: false },
    });
    if (!fs) throw new AppError('الجلسة غير موجودة أو مغلقة بالفعل', 'NOT_FOUND', 404);
    const endedAt = new Date();
    const durationMinutes = Math.max(
      1,
      Math.round((endedAt.getTime() - fs.startedAt.getTime()) / 60000),
    );
    fs.endedAt = endedAt;
    fs.durationMinutes = durationMinutes;
    await fs.save();
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function upsertReviewAction(form: FormData): Promise<Result> {
  const session = await requireSession();
  const parsed = ReviewSchema.safeParse({
    obstacle: form.get('obstacle') || undefined,
    nextStep: form.get('nextStep') || undefined,
    notes: form.get('notes') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  try {
    await connectDb();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    await DailyReviewModel.findOneAndUpdate(
      { userId: session.userId, date: { $gte: start, $lt: end } },
      { $set: { ...parsed.data, date: start } },
      { upsert: true },
    );
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}