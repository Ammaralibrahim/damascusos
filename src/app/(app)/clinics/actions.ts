'use server';

import { revalidatePath } from 'next/cache';
import { connectDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import {
  ClinicCreateSchema,
  ClinicUpdateSchema,
  InteractionCreateSchema,
  StageChangeSchema,
} from '@/schemas';
import { ClinicModel } from '@/models/Clinic';
import { InteractionModel } from '@/models/Interaction';
import { FollowUpModel } from '@/models/FollowUp';
import { TaskModel } from '@/models/Task';
import { findDuplicateCandidates } from '@/lib/data';
import { AppError, toUserMessage } from '@/lib/errors';

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; duplicates?: { id: string; name: string; area?: string }[] };

/* ============================================================
   إنشاء عيادة
   ============================================================ */
export async function createClinicAction(form: FormData): Promise<ActionResult> {
  await requireSession();
  const raw = Object.fromEntries(form.entries());
  const parsed = ClinicCreateSchema.safeParse({
    ...raw,
    hasWebsite: raw.hasWebsite ?? 'unknown',
    mobileFriendly: raw.mobileFriendly ?? 'unknown',
    servicesClear: raw.servicesClear ?? 'unknown',
    basicInfoPresent: raw.basicInfoPresent ?? 'unknown',
    bookingPresent: raw.bookingPresent ?? 'unknown',
    contactClear: raw.contactClear ?? 'unknown',
    scoringComplete: form.get('scoringComplete') === 'on',
    scoreProblem: form.get('scoreProblem') ?? 0,
    scoreFit: form.get('scoreFit') ?? 0,
    scoreAccess: form.get('scoreAccess') ?? 0,
    scoreInterest: form.get('scoreInterest') ?? 0,
    scoreNextStep: form.get('scoreNextStep') ?? 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  const data = parsed.data;

  try {
    if (form.get('confirmDuplicate') !== '1') {
      const dups = await findDuplicateCandidates({
        phone: data.phone,
        name: data.name,
        area: data.area,
        website: data.website,
      });
      if (dups.length) {
        return {
          ok: false,
          error: 'قد تكون هذه العيادة مكررة. راجع السجلات الموجودة أو تابع للتأكيد.',
          duplicates: dups.map((d) => ({
            id: String(d._id),
            name: d.name,
            area: d.area ?? undefined,
          })),
        };
      }
    }

    await connectDb();
    const created = await ClinicModel.create({
      name: data.name,
      clinicType: data.clinicType,
      doctorName: data.doctorName,
      city: data.city,
      area: data.area,
      phone: data.phone,
      website: data.website,
      social: data.social,
      source: data.source,
      digital: {
        hasWebsite: data.hasWebsite,
        mobileFriendly: data.mobileFriendly,
        servicesClear: data.servicesClear,
        basicInfoPresent: data.basicInfoPresent,
        bookingPresent: data.bookingPresent,
        contactClear: data.contactClear,
        observedIssue: data.observedIssue,
        suggestedImprovement: data.suggestedImprovement,
      },
      scores: {
        problem: data.scoreProblem,
        fit: data.scoreFit,
        access: data.scoreAccess,
        interest: data.scoreInterest,
        nextStep: data.scoreNextStep,
        complete: data.scoringComplete,
      },
      stage: data.stage,
      notes: data.notes,
    });
    revalidatePath('/clinics');
    revalidatePath('/');
    return { ok: true, id: String(created._id) };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   تحديث عيادة
   ============================================================ */
export async function updateClinicAction(form: FormData): Promise<ActionResult> {
  await requireSession();

  const clinicId = String(form.get('clinicId') ?? '');
  if (!/^[a-f\d]{24}$/i.test(clinicId)) {
    return { ok: false, error: 'معرف العيادة غير صالح' };
  }

  const raw = Object.fromEntries(form.entries());
  const scoringComplete =
    form.get('scoringComplete') === 'on' ||
    form.get('scoringComplete') === 'true' ||
    form.get('scoringComplete') === '1';

  const parsed = ClinicUpdateSchema.safeParse({
    ...raw,
    doctorName: raw.doctorName || undefined,
    city: raw.city || undefined,
    area: raw.area || undefined,
    phone: raw.phone || undefined,
    website: raw.website || undefined,
    social: raw.social || undefined,
    source: raw.source || undefined,
    clinicType: raw.clinicType || undefined,
    observedIssue: raw.observedIssue || undefined,
    suggestedImprovement: raw.suggestedImprovement || undefined,
    notes: raw.notes || undefined,
    scoringComplete,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }

  try {
    await connectDb();
    const d = parsed.data;
    const update: Record<string, unknown> = {};

    const rootFields = [
      'name',
      'clinicType',
      'doctorName',
      'city',
      'area',
      'phone',
      'website',
      'social',
      'source',
      'notes',
      'stage',
    ] as const;
    for (const k of rootFields) {
      if (d[k] !== undefined) update[k] = d[k];
    }

    if (d.hasWebsite !== undefined) update['digital.hasWebsite'] = d.hasWebsite;
    if (d.mobileFriendly !== undefined) update['digital.mobileFriendly'] = d.mobileFriendly;
    if (d.servicesClear !== undefined) update['digital.servicesClear'] = d.servicesClear;
    if (d.basicInfoPresent !== undefined) update['digital.basicInfoPresent'] = d.basicInfoPresent;
    if (d.bookingPresent !== undefined) update['digital.bookingPresent'] = d.bookingPresent;
    if (d.contactClear !== undefined) update['digital.contactClear'] = d.contactClear;
    if (d.observedIssue !== undefined) update['digital.observedIssue'] = d.observedIssue;
    if (d.suggestedImprovement !== undefined)
      update['digital.suggestedImprovement'] = d.suggestedImprovement;

    if (d.scoreProblem !== undefined) update['scores.problem'] = d.scoreProblem;
    if (d.scoreFit !== undefined) update['scores.fit'] = d.scoreFit;
    if (d.scoreAccess !== undefined) update['scores.access'] = d.scoreAccess;
    if (d.scoreInterest !== undefined) update['scores.interest'] = d.scoreInterest;
    if (d.scoreNextStep !== undefined) update['scores.nextStep'] = d.scoreNextStep;
    if (d.scoringComplete !== undefined) update['scores.complete'] = d.scoringComplete;

    if (Object.keys(update).length === 0) return { ok: true };

    const updated = await ClinicModel.findByIdAndUpdate(
      clinicId,
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!updated) throw new AppError('العيادة غير موجودة', 'NOT_FOUND', 404);

    revalidatePath(`/clinics/${clinicId}`);
    revalidatePath('/clinics');
    revalidatePath('/');
    return { ok: true, id: clinicId };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   تغيير المرحلة
   ============================================================ */
export async function changeStageAction(form: FormData): Promise<ActionResult> {
  await requireSession();
  const parsed = StageChangeSchema.safeParse({
    clinicId: form.get('clinicId'),
    stage: form.get('stage'),
    lostReason: form.get('lostReason') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  try {
    await connectDb();
    const updates: Record<string, unknown> = { stage: parsed.data.stage };
    if (parsed.data.stage === 'not_interested' && parsed.data.lostReason) {
      updates.lostReason = parsed.data.lostReason;
    }
    const updated = await ClinicModel.findByIdAndUpdate(
      parsed.data.clinicId,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!updated) throw new AppError('العيادة غير موجودة', 'NOT_FOUND', 404);
    revalidatePath(`/clinics/${parsed.data.clinicId}`);
    revalidatePath('/clinics');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   إنشاء تواصل
   ============================================================ */
export async function createInteractionAction(form: FormData): Promise<ActionResult> {
  await requireSession();
  const parsed = InteractionCreateSchema.safeParse({
    clinicId: form.get('clinicId'),
    type: form.get('type'),
    occurredAt: form.get('occurredAt') || new Date().toISOString(),
    summary: form.get('summary'),
    outcome: form.get('outcome') || undefined,
    nextStep: form.get('nextStep') || undefined,
    followUpAt: form.get('followUpAt') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  try {
    await connectDb();
    const clinic = await ClinicModel.findById(parsed.data.clinicId);
    if (!clinic) throw new AppError('العيادة غير موجودة', 'NOT_FOUND', 404);
    await InteractionModel.create(parsed.data);
    clinic.lastContactAt = parsed.data.occurredAt;
    await clinic.save();
    revalidatePath(`/clinics/${parsed.data.clinicId}`);
    revalidatePath('/today');
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   عدّ السجلات التابعة — للحذف
   ============================================================ */
export async function getClinicDependents(clinicId: string): Promise<{
  interactions: number;
  followUps: number;
  tasks: number;
}> {
  await requireSession();
  await connectDb();
  const [interactions, followUps, tasks] = await Promise.all([
    InteractionModel.countDocuments({ clinicId }),
    FollowUpModel.countDocuments({ clinicId }),
    TaskModel.countDocuments({ clinicId }),
  ]);
  return { interactions, followUps, tasks };
}

/* ============================================================
   حذف عيادة واحدة
   ============================================================ */
export async function deleteClinicAction(form: FormData): Promise<ActionResult> {
  await requireSession();

  const clinicId = String(form.get('clinicId') ?? '');
  const confirmName = String(form.get('confirmName') ?? '').trim();

  if (!/^[a-f\d]{24}$/i.test(clinicId)) {
    return { ok: false, error: 'معرف العيادة غير صالح' };
  }

  try {
    await connectDb();
    const clinic = await ClinicModel.findById(clinicId).select('name').exec();
    if (!clinic) throw new AppError('العيادة غير موجودة', 'NOT_FOUND', 404);

    if (confirmName !== clinic.name) {
      return {
        ok: false,
        error: 'اسم التأكيد لا يطابق اسم العيادة.',
      };
    }

    await InteractionModel.deleteMany({ clinicId });
    await FollowUpModel.deleteMany({ clinicId });
    await TaskModel.updateMany({ clinicId }, { $unset: { clinicId: '' } });
    await ClinicModel.deleteOne({ _id: clinicId });

    revalidatePath('/clinics');
    revalidatePath('/today');
    revalidatePath('/followups');
    revalidatePath('/');
    return { ok: true, id: clinicId };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}

/* ============================================================
   حذف جماعي
   ============================================================ */
export async function deleteClinicsAction(form: FormData): Promise<ActionResult> {
  await requireSession();

  const idsRaw = form.getAll('clinicIds').map(String);
  const confirmWord = String(form.get('confirmWord') ?? '').trim();

  if (idsRaw.length === 0) {
    return { ok: false, error: 'لا توجد عيادات محددة' };
  }
  if (idsRaw.length > 100) {
    return { ok: false, error: 'الحد الأقصى 100 عيادة في العملية الواحدة' };
  }
  const ids = idsRaw.filter((id) => /^[a-f\d]{24}$/i.test(id));
  if (ids.length !== idsRaw.length) {
    return { ok: false, error: 'معرف عيادة واحد أو أكثر غير صالح' };
  }
  if (confirmWord !== `حذف ${ids.length}` && confirmWord !== 'حذف') {
    return {
      ok: false,
      error: 'اكتب "حذف" أو "حذف N" (حيث N هو عدد العيادات) للتأكيد.',
    };
  }

  try {
    await connectDb();
    const existing = await ClinicModel.find({ _id: { $in: ids } })
      .select('_id')
      .exec();
    const foundIds = existing.map((c) => c._id);
    if (foundIds.length === 0) {
      return { ok: false, error: 'لم يتم العثور على عيادات مطابقة' };
    }

    await InteractionModel.deleteMany({ clinicId: { $in: foundIds } });
    await FollowUpModel.deleteMany({ clinicId: { $in: foundIds } });
    await TaskModel.updateMany(
      { clinicId: { $in: foundIds } },
      { $unset: { clinicId: '' } },
    );
    await ClinicModel.deleteMany({ _id: { $in: foundIds } });

    revalidatePath('/clinics');
    revalidatePath('/today');
    revalidatePath('/followups');
    revalidatePath('/');
    return { ok: true, id: String(foundIds.length) };
  } catch (err) {
    return { ok: false, error: toUserMessage(err) };
  }
}