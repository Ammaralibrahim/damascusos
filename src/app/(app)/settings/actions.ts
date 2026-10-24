'use server';

import { revalidatePath } from 'next/cache';
import { connectDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { SettingsSchema, ClinicTypeInput } from '@/schemas';
import { UserModel } from '@/models/User';
import { ClinicModel } from '@/models/Clinic';
import { toUserMessage } from '@/lib/errors';
import {
  mergeClinicTypes,
  slugifyClinicType,
  type ClinicTypeConfig,
} from '@/lib/clinic-types';

export type Result = { ok: true } | { ok: false; error: string };

/* ============================================================
   حفظ الإعدادات العامة
   ============================================================ */
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
    const user = await UserModel.findById(session.userId);
    if (!user) return { ok: false, error: 'المستخدم غير موجود' };

    user.set({
      'settings.displayName': parsed.data.displayName,
      'settings.projectName': parsed.data.projectName,
      'settings.defaultSector': parsed.data.defaultSector,
      'settings.defaultMarket': parsed.data.defaultMarket,
      'settings.mainService': parsed.data.mainService,
      'settings.workStartHour': parsed.data.workStartHour,
      'settings.workEndHour': parsed.data.workEndHour,
      'settings.workDays': parsed.data.workDays,
      'settings.timezone': parsed.data.timezone,
      'settings.currency': parsed.data.currency,
      'settings.weeklyOutreachGoal': parsed.data.weeklyOutreachGoal,
      'settings.demoTimeLimitMinutes': parsed.data.demoTimeLimitMinutes,
      'settings.inAppNotifications': parsed.data.inAppNotifications,
    });
    await user.save();

    revalidatePath('/settings');
    revalidatePath('/');
    revalidatePath('/clinics');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   إضافة نوع عيادة
   ============================================================ */
export async function addClinicTypeAction(form: FormData): Promise<Result> {
  const session = await requireSession();

  const label = String(form.get('label') ?? '').trim();
  const description = String(form.get('description') ?? '').trim() || undefined;
  const slugInput = String(form.get('slug') ?? '').trim();

  if (!label) return { ok: false, error: 'اسم النوع مطلوب' };

  const slug = slugInput || slugifyClinicType(label);

  const parsed = ClinicTypeInput.safeParse({
    slug,
    label,
    description,
    active: true,
    builtin: false,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }

  try {
    await connectDb();
    const user = await UserModel.findById(session.userId);
    if (!user) return { ok: false, error: 'المستخدم غير موجود' };

    const current = mergeClinicTypes(
      (user.settings as { clinicTypes?: ClinicTypeConfig[] } | undefined)
        ?.clinicTypes,
    );

    if (current.some((t) => t.slug === parsed.data.slug)) {
      return { ok: false, error: `النوع "${parsed.data.slug}" موجود بالفعل` };
    }
    if (
      current.some(
        (t) => t.label.trim().toLowerCase() === parsed.data.label.toLowerCase(),
      )
    ) {
      return { ok: false, error: `اسم النوع "${parsed.data.label}" مستخدم بالفعل` };
    }

    const next = [...current, parsed.data];
    user.set('settings.clinicTypes', next);
    await user.save();

    revalidatePath('/settings');
    revalidatePath('/clinics');
    revalidatePath('/clinics/new');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   تعديل نوع عيادة
   ============================================================ */
export async function updateClinicTypeAction(form: FormData): Promise<Result> {
  const session = await requireSession();

  const slug = String(form.get('slug') ?? '').trim();
  const label = String(form.get('label') ?? '').trim();
  const description = String(form.get('description') ?? '').trim() || undefined;
  const active = form.get('active') === 'on' || form.get('active') === 'true';

  if (!slug) return { ok: false, error: 'المعرّف مفقود' };
  if (!label) return { ok: false, error: 'الاسم مطلوب' };

  try {
    await connectDb();
    const user = await UserModel.findById(session.userId);
    if (!user) return { ok: false, error: 'المستخدم غير موجود' };

    const current = mergeClinicTypes(
      (user.settings as { clinicTypes?: ClinicTypeConfig[] } | undefined)
        ?.clinicTypes,
    );

    const idx = current.findIndex((t) => t.slug === slug);
    if (idx === -1) return { ok: false, error: 'النوع غير موجود' };

    if (
      current.some(
        (t) =>
          t.slug !== slug &&
          t.label.trim().toLowerCase() === label.toLowerCase(),
      )
    ) {
      return { ok: false, error: `اسم النوع "${label}" مستخدم بالفعل` };
    }

    const updated = {
      ...current[idx],
      label,
      description,
      active,
    };
    const next = [...current];
    next[idx] = updated;

    user.set('settings.clinicTypes', next);
    await user.save();

    revalidatePath('/settings');
    revalidatePath('/clinics');
    revalidatePath('/clinics/new');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   حذف نوع عيادة
   ============================================================ */
export async function deleteClinicTypeAction(form: FormData): Promise<Result> {
  const session = await requireSession();

  const slug = String(form.get('slug') ?? '').trim();
  if (!slug) return { ok: false, error: 'المعرّف مفقود' };

  try {
    await connectDb();
    const user = await UserModel.findById(session.userId);
    if (!user) return { ok: false, error: 'المستخدم غير موجود' };

    const current = mergeClinicTypes(
      (user.settings as { clinicTypes?: ClinicTypeConfig[] } | undefined)
        ?.clinicTypes,
    );
    const target = current.find((t) => t.slug === slug);
    if (!target) return { ok: false, error: 'النوع غير موجود' };
    if (target.builtin) {
      return {
        ok: false,
        error: 'لا يمكن حذف نوع مدمج — يمكنك تعطيله فقط',
      };
    }

    const usageCount = await ClinicModel.countDocuments({ clinicType: slug });
    if (usageCount > 0) {
      return {
        ok: false,
        error: `لا يمكن الحذف — النوع مستخدم في ${usageCount} عيادة. عطّله بدلًا من ذلك.`,
      };
    }

    const next = current.filter((t) => t.slug !== slug);
    user.set('settings.clinicTypes', next);
    await user.save();

    revalidatePath('/settings');
    revalidatePath('/clinics');
    revalidatePath('/clinics/new');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}