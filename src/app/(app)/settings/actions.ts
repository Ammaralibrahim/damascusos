'use server';

import { revalidatePath } from 'next/cache';
import { connectDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { SettingsSchema } from '@/schemas';
import { UserModel } from '@/models/User';
import { toUserMessage } from '@/lib/errors';

export type Result = { ok: true } | { ok: false; error: string };

export async function updateSettingsAction(form: FormData): Promise<Result> {
  const session = await requireSession();
  const workDaysRaw = form.getAll('workDays').map((v) => Number(v));
  const parsed = SettingsSchema.safeParse({
    displayName: form.get('displayName'),
    projectName: form.get('projectName'),
    defaultSector: form.get('defaultSector'),
    defaultMarket: form.get('defaultMarket'),
    mainService: form.get('mainService'),
    workStartHour: form.get('workStartHour'),
    workEndHour: form.get('workEndHour'),
    workDays: workDaysRaw,
    timezone: form.get('timezone'),
    currency: form.get('currency'),
    weeklyOutreachGoal: form.get('weeklyOutreachGoal'),
    demoTimeLimitMinutes: form.get('demoTimeLimitMinutes'),
    inAppNotifications: form.get('inAppNotifications') === 'on',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  if (parsed.data.workEndHour <= parsed.data.workStartHour) {
    return { ok: false, error: 'ساعة النهاية يجب أن تكون بعد ساعة البداية' };
  }
  try {
    await connectDb();
    const updated = await UserModel.findByIdAndUpdate(
      session.userId,
      { $set: { settings: parsed.data } },
      { new: true, runValidators: true },
    );
    if (!updated) return { ok: false, error: 'المستخدم غير موجود' };
    revalidatePath('/settings');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}