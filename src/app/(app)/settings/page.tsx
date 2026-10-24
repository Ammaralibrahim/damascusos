import { requireSession } from '@/lib/auth';
import { getSettings } from '@/lib/data';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getSettings(session.userId);
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-fg-tertiary">الإعدادات</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
          الإعدادات
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
          تحكّم في تفضيلاتك، وأنواع العيادات، والتفاصيل العامة للنظام.
        </p>
      </header>
      <SettingsForm
        initial={{
          displayName: settings.displayName,
          projectName: settings.projectName,
          defaultSector: settings.defaultSector,
          defaultMarket: settings.defaultMarket,
          mainService: settings.mainService,
          workStartHour: settings.workStartHour,
          workEndHour: settings.workEndHour,
          workDays: settings.workDays,
          timezone: settings.timezone,
          currency: settings.currency,
          weeklyOutreachGoal: settings.weeklyOutreachGoal,
          demoTimeLimitMinutes: settings.demoTimeLimitMinutes,
          inAppNotifications: settings.inAppNotifications,
          clinicTypes: settings.clinicTypes,
        }}
      />
    </div>
  );
}