import { z } from 'zod';

export const ClinicStage = z.enum([
  'new',
  'verifying',
  'qualified',
  'contacted',
  'awaiting_reply',
  'initial_interest',
  'discussing',
  'demo_preparing',
  'demo',
  'quote',
  'negotiation',
  'won',
  'paid',
  'not_interested',
  'paused',
  'future_followup',
]);

export const TaskStatus = z.enum(['todo', 'in_progress', 'done', 'postponed', 'cancelled']);
export const TaskPriority = z.enum(['low', 'medium', 'high']);
export const TaskKind = z.enum(['research', 'outreach', 'dev', 'admin', 'learning', 'review']);

export const InteractionType = z.enum([
  'call',
  'message',
  'reply',
  'meeting',
  'demo',
  'quote',
  'followup',
  'note',
  'stage_change',
]);

const trimmed = (min: number, max: number) =>
  z.string().trim().min(min, `الحد الأدنى ${min} حرف`).max(max, `الحد الأقصى ${max} حرف`);

const optionalString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .url('رابط غير صالح')
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

const yesNoUnknown = z.enum(['yes', 'no', 'unknown']);

export const ClinicTypeInput = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_-]+$/, 'المعرّف يجب أن يحتوي حروفًا إنجليزية صغيرة وأرقامًا وشُرَطًا فقط'),
  label: z.string().trim().min(1).max(80),
  description: optionalString,
  active: z.coerce.boolean().default(true),
  builtin: z.coerce.boolean().default(false),
});

export const ClinicCreateSchema = z.object({
  name: trimmed(2, 120),
  clinicType: optionalString,
  doctorName: optionalString,
  city: optionalString,
  area: optionalString,
  phone: optionalString,
  website: optionalUrl,
  social: optionalString,
  instagramUrl: optionalUrl,
  whatsapp: optionalString,
  source: optionalString,
  demoUrl: optionalUrl,
  demoStartedAt: z.coerce.date().optional(),
  firstContactAt: z.coerce.date().optional(),
  lastOutcome: optionalString,
  nextStepNote: optionalString,
  hasWebsite: yesNoUnknown.default('unknown'),
  mobileFriendly: yesNoUnknown.default('unknown'),
  servicesClear: yesNoUnknown.default('unknown'),
  basicInfoPresent: yesNoUnknown.default('unknown'),
  bookingPresent: yesNoUnknown.default('unknown'),
  contactClear: yesNoUnknown.default('unknown'),
  observedIssue: optionalString,
  suggestedImprovement: optionalString,
  scoreProblem: z.coerce.number().int().min(0).max(25).default(0),
  scoreFit: z.coerce.number().int().min(0).max(20).default(0),
  scoreAccess: z.coerce.number().int().min(0).max(15).default(0),
  scoreInterest: z.coerce.number().int().min(0).max(25).default(0),
  scoreNextStep: z.coerce.number().int().min(0).max(15).default(0),
  scoringComplete: z.coerce.boolean().default(false),
  stage: ClinicStage.default('new'),
  notes: optionalString,
});

export const ClinicUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  clinicType: optionalString,
  doctorName: optionalString,
  city: optionalString,
  area: optionalString,
  phone: optionalString,
  website: optionalUrl,
  social: optionalString,
  instagramUrl: optionalUrl,
  whatsapp: optionalString,
  source: optionalString,
  demoUrl: optionalUrl,
  demoStartedAt: z.coerce.date().optional(),
  firstContactAt: z.coerce.date().optional(),
  lastOutcome: optionalString,
  nextStepNote: optionalString,
  hasWebsite: yesNoUnknown.optional(),
  mobileFriendly: yesNoUnknown.optional(),
  servicesClear: yesNoUnknown.optional(),
  basicInfoPresent: yesNoUnknown.optional(),
  bookingPresent: yesNoUnknown.optional(),
  contactClear: yesNoUnknown.optional(),
  observedIssue: optionalString,
  suggestedImprovement: optionalString,
  scoreProblem: z.coerce.number().int().min(0).max(25).optional(),
  scoreFit: z.coerce.number().int().min(0).max(20).optional(),
  scoreAccess: z.coerce.number().int().min(0).max(15).optional(),
  scoreInterest: z.coerce.number().int().min(0).max(25).optional(),
  scoreNextStep: z.coerce.number().int().min(0).max(15).optional(),
  scoringComplete: z.coerce.boolean().optional(),
  stage: ClinicStage.optional(),
  lostReason: optionalString,
  notes: optionalString,
});

export const TaskCreateSchema = z.object({
  title: trimmed(2, 200),
  description: optionalString,
  kind: TaskKind.default('admin'),
  priority: TaskPriority.default('medium'),
  status: TaskStatus.default('todo'),
  estimatedMinutes: z.coerce.number().int().min(5).max(600).optional(),
  deadline: z.coerce.date().optional(),
  scheduledFor: z.coerce.date().optional(),
  clinicId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'معرف عميل غير صالح')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  notes: optionalString,
});

export const TaskUpdateSchema = TaskCreateSchema.partial();

export const InteractionCreateSchema = z.object({
  clinicId: z.string().regex(/^[a-f\d]{24}$/i, 'معرف عميل غير صالح'),
  type: InteractionType,
  occurredAt: z.coerce.date(),
  summary: trimmed(2, 1000),
  outcome: optionalString,
  nextStep: optionalString,
  followUpAt: z.coerce.date().optional(),
});

export const FollowUpCreateSchema = z
  .object({
    clinicId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, 'معرف عميل غير صالح')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : undefined)),
    taskId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, 'معرف مهمة غير صالح')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : undefined)),
    dueAt: z.coerce.date().optional(),
    note: trimmed(2, 500),
  })
  .refine((v) => v.clinicId || v.taskId, {
    message: 'يجب ربط المتابعة بعيادة أو مهمة',
  });

export const SettingsSchema = z.object({
  displayName: trimmed(1, 80),
  projectName: trimmed(1, 80),
  defaultSector: trimmed(1, 120),
  defaultMarket: trimmed(1, 120),
  mainService: trimmed(1, 200),
  workStartHour: z.coerce.number().int().min(0).max(23),
  workEndHour: z.coerce.number().int().min(1).max(24),
  workDays: z.array(z.number().int().min(0).max(6)).min(1),
  timezone: z.string().min(3),
  currency: z.string().length(3),
  weeklyOutreachGoal: z.coerce.number().int().min(0).max(500),
  demoTimeLimitMinutes: z.coerce.number().int().min(30).max(2000),
  inAppNotifications: z.coerce.boolean(),
});

export const StageChangeSchema = z.object({
  clinicId: z.string().regex(/^[a-f\d]{24}$/i),
  stage: ClinicStage,
  lostReason: optionalString,
});

export const ReviewSchema = z.object({
  obstacle: optionalString,
  nextStep: optionalString,
  notes: optionalString,
});

export type ClinicCreateInput = z.infer<typeof ClinicCreateSchema>;
export type ClinicUpdateInput = z.infer<typeof ClinicUpdateSchema>;
export type ClinicTypeInput = z.infer<typeof ClinicTypeInput>;
export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;
export type InteractionCreateInput = z.infer<typeof InteractionCreateSchema>;
export type SettingsInput = z.infer<typeof SettingsSchema>;