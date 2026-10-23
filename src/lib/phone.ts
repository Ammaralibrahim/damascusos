/**
 * توحيد أرقام الهاتف السورية للمقارنة فقط.
 *
 * - يُرجع نصًا رقميًا موحّدًا (أو null إذا كان غير صالح).
 * - لا يغيّر القيمة الأصلية المعروضة للمستخدم.
 * - القاعدة الأساسية: تحويل الصيغ الدولية إلى الصيغة المحلية السورية (تبدأ بـ 0).
 */

export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;

  // أزل كل ما ليس رقمًا: المسافات، الأقواس، الشُرَط، علامات + وغيرها.
  const digits = raw.replace(/\D+/g, '');

  // الحد الأدنى المقبول (6 أرقام) لتفادي اعتبار مدخلات قصيرة أرقامًا.
  if (digits.length < 6) return null;

  // الصيغ الدولية لسوريا → محلية:
  // 00963xxxxxxxxx  →  0xxxxxxxxx
  // 963xxxxxxxxx    →  0xxxxxxxxx
  if (digits.startsWith('00963')) return '0' + digits.slice(5);
  if (digits.startsWith('963')) return '0' + digits.slice(3);

  // أرقام محلية أو دولية أخرى: نُبقيها كما هي بعد إزالة غير الأرقام.
  return digits;
}