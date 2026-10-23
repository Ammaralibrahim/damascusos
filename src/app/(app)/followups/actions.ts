'use server';

import { revalidatePath } from 'next/cache';
import { connectDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { FollowUpCreateSchema } from '@/schemas';
import { FollowUpModel } from '@/models/FollowUp';
import { ClinicModel } from '@/models/Clinic';
import { TaskModel } from '@/models/Task';
import { AppError, toUserMessage } from '@/lib/errors';

export type Result = { ok: true } | { ok: false; error: string };

export async function createFollowUpAction(form: FormData): Promise<Result> {
  await requireSession();
  const parsed = FollowUpCreateSchema.safeParse({
    clinicId: form.get('clinicId') || undefined,
    taskId: form.get('taskId') || undefined,
    dueAt: form.get('dueAt') || undefined,
    note: form.get('note'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  try {
    await connectDb();
    if (parsed.data.clinicId) {
      const exists = await ClinicModel.exists({ _id: parsed.data.clinicId });
      if (!exists) throw new AppError('العيادة غير موجودة', 'NOT_FOUND', 404);
    }
    if (parsed.data.taskId) {
      const exists = await TaskModel.exists({ _id: parsed.data.taskId });
      if (!exists) throw new AppError('المهمة غير موجودة', 'NOT_FOUND', 404);
    }
    await FollowUpModel.create(parsed.data);
    revalidatePath('/followups');
    revalidatePath('/');
    if (parsed.data.clinicId) revalidatePath(`/clinics/${parsed.data.clinicId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function markFollowUpDoneAction(id: string): Promise<Result> {
  await requireSession();
  try {
    await connectDb();
    const r = await FollowUpModel.findByIdAndUpdate(id, {
      status: 'done',
      doneAt: new Date(),
    });
    if (!r) throw new AppError('المتابعة غير موجودة', 'NOT_FOUND', 404);
    revalidatePath('/followups');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function postponeFollowUpAction(id: string, days = 1): Promise<Result> {
  await requireSession();
  try {
    await connectDb();
    const f = await FollowUpModel.findById(id);
    if (!f) throw new AppError('المتابعة غير موجودة', 'NOT_FOUND', 404);
    const base = f.dueAt ?? new Date();
    f.dueAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    await f.save();
    revalidatePath('/followups');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

export async function cancelFollowUpAction(id: string): Promise<Result> {
  await requireSession();
  try {
    await connectDb();
    const r = await FollowUpModel.findByIdAndUpdate(id, { status: 'cancelled' });
    if (!r) throw new AppError('المتابعة غير موجودة', 'NOT_FOUND', 404);
    revalidatePath('/followups');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}