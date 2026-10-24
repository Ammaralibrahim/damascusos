/**
 * أنواع العيادات الافتراضية + دوال مساعدة.
 *
 * التصميم:
 * - الافتراضيات تُستخدم إذا لم يضف المستخدم أنواعًا مخصصة في الإعدادات.
 * - `slug` هو المفتاح الثابت المخزَّن في `Clinic.clinicType`. لا يتغير حتى لو
 *   عدّل المستخدم `label`.
 * - `label` = النص المعروض (قابل للتعديل).
 * - لا يمكن حذف نوع مستخدَم في أي عيادة (يُفرَض في Server Action).
 */

export type ClinicTypeConfig = {
  slug: string;
  label: string;
  description?: string;
  active: boolean;
  builtin?: boolean;
};

export const DEFAULT_CLINIC_TYPES: ClinicTypeConfig[] = [
  {
    slug: 'dental',
    label: 'عيادة أسنان',
    description: 'طب وتجميل الأسنان',
    active: true,
    builtin: true,
  },
  {
    slug: 'dermatology',
    label: 'عيادة جلدية',
    description: 'الأمراض الجلدية',
    active: true,
    builtin: true,
  },
  {
    slug: 'aesthetic',
    label: 'عيادة تجميل',
    description: 'الطب التجميلي',
    active: true,
    builtin: true,
  },
  {
    slug: 'laser',
    label: 'مركز ليزر',
    description: 'العلاج بالليزر',
    active: true,
    builtin: true,
  },
  {
    slug: 'beauty',
    label: 'مركز عناية بالبشرة',
    description: 'العناية بالبشرة والشعر',
    active: true,
    builtin: true,
  },
  {
    slug: 'multi_specialty',
    label: 'عيادة متعددة التخصصات',
    description: 'عدة تخصصات طبية',
    active: true,
    builtin: true,
  },
  {
    slug: 'other',
    label: 'أخرى',
    description: 'تخصص آخر',
    active: true,
    builtin: true,
  },
];

export function slugifyClinicType(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  if (!base) {
    return `type_${Date.now().toString(36)}`;
  }
  if (/[^\x00-\x7F]/.test(base)) {
    return `type_${Date.now().toString(36)}`;
  }
  return base;
}

export function mergeClinicTypes(
  saved: ClinicTypeConfig[] | undefined | null,
): ClinicTypeConfig[] {
  if (!saved || saved.length === 0) return DEFAULT_CLINIC_TYPES;
  const bySlug = new Map<string, ClinicTypeConfig>();
  for (const t of DEFAULT_CLINIC_TYPES) bySlug.set(t.slug, t);
  for (const t of saved) {
    const existing = bySlug.get(t.slug);
    bySlug.set(t.slug, existing ? { ...existing, ...t } : t);
  }
  return Array.from(bySlug.values());
}

export function getClinicTypeLabel(
  slug: string | undefined | null,
  types: ClinicTypeConfig[],
): string {
  if (!slug) return 'غير محدد';
  const t = types.find((x) => x.slug === slug);
  return t?.label ?? slug;
}