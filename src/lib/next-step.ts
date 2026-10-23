import 'server-only';
import { connectDb } from './db';
import { ClinicModel } from '@/models/Clinic';
import { TaskModel } from '@/models/Task';
import { FollowUpModel } from '@/models/FollowUp';

export type Suggestion = {
  id: string;
  action: string;
  reason: string;
  href: string;
  basedOn: string;
  priority: number; // رقم أعلى = أهم
};

const HOURS = 1000 * 60 * 60;
const DAYS = HOURS * 24;

export async function computeNextSteps(): Promise<Suggestion[]> {
  await connectDb();
  const now = new Date();
  const out: Suggestion[] = [];

  // ─────────────────────────────────────────────────────────
  // P100: متابعة متأخرة — الأهم تجاريًا (قد تُفقد الفرصة)
  // ─────────────────────────────────────────────────────────
  const overdueFollow = await FollowUpModel.findOne({
    status: 'open',
    dueAt: { $lte: now },
  })
    .sort({ dueAt: 1 })
    .lean();
  if (overdueFollow) {
    const daysLate = Math.floor(
      (now.getTime() - (overdueFollow.dueAt?.getTime() ?? now.getTime())) / DAYS,
    );
    out.push({
      id: 'followup-overdue',
      action: 'راجع المتابعة المتأخرة',
      reason:
        daysLate === 0
          ? 'تأخرت منذ ساعات — قد تفقد الفرصة.'
          : `تأخرت ${daysLate} يومًا — قد تفقد الفرصة.`,
      href: '/followups',
      basedOn: `followUpId=${overdueFollow._id}`,
      priority: 100,
    });
  }

  // ─────────────────────────────────────────────────────────
  // P90: عرض سعر/عرض تجريبي خامل ≥ 3 أيام — دورة البيع عالقة
  // ─────────────────────────────────────────────────────────
  const stalledQuote = await ClinicModel.findOne({
    stage: { $in: ['quote', 'demo', 'negotiation'] },
    lastContactAt: { $lte: new Date(now.getTime() - 3 * DAYS) },
  })
    .sort({ lastContactAt: 1 })
    .lean();
  if (stalledQuote) {
    const days = Math.floor(
      (now.getTime() - (stalledQuote.lastContactAt?.getTime() ?? now.getTime())) / DAYS,
    );
    out.push({
      id: 'stalled-quote',
      action: `تابع ${stalledQuote.name}`,
      reason: `عرض قيد المراجعة منذ ${days} يومًا دون تحديث.`,
      href: `/clinics/${stalledQuote._id}`,
      basedOn: `clinicId=${stalledQuote._id}`,
      priority: 90,
    });
  }

  // ─────────────────────────────────────────────────────────
  // P80: عيادة مؤهلة لم يُتواصل معها — أول تواصل
  // ─────────────────────────────────────────────────────────
  const qualifiedNoContact = await ClinicModel.findOne({
    stage: 'qualified',
    lastContactAt: { $exists: false },
  })
    .sort({ updatedAt: 1 })
    .lean();
  if (qualifiedNoContact) {
    out.push({
      id: 'qualified-no-contact',
      action: `تواصل مع ${qualifiedNoContact.name}`,
      reason: 'عيادة مؤهلة، لم يُسجَّل لها أي تواصل بعد.',
      href: `/clinics/${qualifiedNoContact._id}`,
      basedOn: `clinicId=${qualifiedNoContact._id}`,
      priority: 80,
    });
  }

  // ─────────────────────────────────────────────────────────
  // P70: عيادة "جديدة" منذ يومين — تحتاج تأهيلًا
  // ─────────────────────────────────────────────────────────
  const needsQualification = await ClinicModel.findOne({
    stage: 'new',
    updatedAt: { $lte: new Date(now.getTime() - 2 * DAYS) },
  })
    .sort({ updatedAt: 1 })
    .lean();
  if (needsQualification) {
    out.push({
      id: 'needs-qualification',
      action: `أهّل ${needsQualification.name}`,
      reason: 'أُضيفت منذ يومين ولم تُحدَّد مؤهلة أو مستبعدة.',
      href: `/clinics/${needsQualification._id}`,
      basedOn: `clinicId=${needsQualification._id}`,
      priority: 70,
    });
  }

  // ─────────────────────────────────────────────────────────
  // P60: تواصل بلا نتيجة ≥ 48 ساعة — حدّث السجل
  // ─────────────────────────────────────────────────────────
  const needsOutcome = await ClinicModel.findOne({
    stage: { $in: ['contacted', 'awaiting_reply'] },
    lastContactAt: { $lte: new Date(now.getTime() - 48 * HOURS) },
  }).lean();
  if (needsOutcome) {
    out.push({
      id: 'contact-no-result',
      action: `حدّث نتيجة التواصل مع ${needsOutcome.name}`,
      reason: 'مرّت 48 ساعة دون تحديث نتيجة آخر تواصل مسجّل.',
      href: `/clinics/${needsOutcome._id}`,
      basedOn: `clinicId=${needsOutcome._id}`,
      priority: 60,
    });
  }

  // ─────────────────────────────────────────────────────────
  // P40: مهمة ضخمة — آخر الأولوية (لا تحرك المبيعات مباشرة)
  // ─────────────────────────────────────────────────────────
  const bigTask = await TaskModel.findOne({
    status: { $in: ['todo', 'in_progress'] },
    estimatedMinutes: { $gte: 180 },
  }).lean();
  if (bigTask) {
    out.push({
      id: 'big-task',
      action: `قسّم مهمة "${bigTask.title}"`,
      reason: 'المهمة تفوق 3 ساعات — قسّمها لبدء التنفيذ.',
      href: '/today',
      basedOn: `taskId=${bigTask._id}`,
      priority: 40,
    });
  }

  // إرجاع الأهم فقط — متوافق مع الواجهة الحالية (تقرأ العنصر الأول)
  return out.sort((a, b) => b.priority - a.priority).slice(0, 1);
}