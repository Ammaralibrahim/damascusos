/**
 * تقييم فرصة البيع من 100 نقطة.
 *
 * التصميم:
 * - الدرجات تُخزَّن في قاعدة البيانات (داخل clinic.scores)، لأنها مدخلات المستخدم.
 * - "الإجمالي" يُحسب ديناميكيًا هنا كلما احتجناه، لأنه اشتقاق وليس بيانات أولية.
 * - "complete" علامة يديرها المستخدم: هل التقييم مبني على معلومات مُتحقَّق منها؟
 *   (يمنع اعتبار درجات افتراضية "تقييمًا مكتملًا").
 * - الأوزان ثابتة في المرحلة 1. البنية جاهزة لجعلها قابلة للتعديل عبر الإعدادات
 *   عبر validateWeights (توجد بالفعل) دون تغيير هذه الوحدة.
 */

import type { ClinicDoc } from '@/models/Clinic';

export const DEFAULT_WEIGHTS = {
  problem: 25,  // وضوح المشكلة الرقمية
  fit: 20,      // ملاءمة الخدمة لاحتياجات العيادة
  access: 15,   // إمكانية الوصول إلى صاحب القرار
  interest: 25, // وجود اهتمام تجاري فعلي
  nextStep: 15, // وضوح الخطوة التالية وإمكانية المتابعة
} as const;

export const MAX_TOTAL = 100;

export type ScoreInput = NonNullable<ClinicDoc['scores']>;

/**
 * يحسب إجمالي التقييم وعلامة الاكتمال.
 * - يقبل undefined بأمان (عيادة قديمة قبل إضافة التقييم).
 * - يقصّ الناتج عند 100 كحد أقصى (حماية من بيانات غير متسقة في القاعدة).
 */
export function scoreClinic(scores: ScoreInput | undefined): {
  total: number;
  complete: boolean;
} {
  if (!scores) return { total: 0, complete: false };

  const total =
    (scores.problem ?? 0) +
    (scores.fit ?? 0) +
    (scores.access ?? 0) +
    (scores.interest ?? 0) +
    (scores.nextStep ?? 0);

  return {
    total: Math.min(total, MAX_TOTAL),
    complete: Boolean(scores.complete),
  };
}

/**
 * تحقق من صحة الأوزان — يُستدعى عند تحميل الإعدادات (المرحلة 3).
 * مجموع الأوزان يجب أن يساوي 100 بالضبط.
 */
export function validateWeights(w: typeof DEFAULT_WEIGHTS): void {
  const sum = w.problem + w.fit + w.access + w.interest + w.nextStep;
  if (sum !== 100) {
    throw new Error('مجموع أوزان التقييم يجب أن يساوي 100.');
  }
}