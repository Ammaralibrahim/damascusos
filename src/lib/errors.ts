/**
 * أخطاء التطبيق الموحدة.
 *
 * - AppError: خطأ "متوقع" يحمل رمزًا وحالة HTTP، ويُعرض نصّه للمستخدم مباشرة.
 * - toUserMessage: يُغلِّف أي خطأ غير متوقع برسالة آمنة، ويُسجِّل التفاصيل في السجل.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'APP_ERROR',
    public status: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toUserMessage(err: unknown): string {
  // 1) الأخطاء المتوقعة: نثق بنصّها (كتبناها نحن).
  if (err instanceof AppError) return err.message;

  // 2) الأخطاء غير المتوقعة: نُسجِّل التفاصيل داخليًا فقط.
  if (err instanceof Error) {
    console.error('[internal]', err.message);
  }

  // 3) الرسالة الآمنة المعروضة للمستخدم.
  return 'حدث خطأ غير متوقع. حاول مجددًا.';
}