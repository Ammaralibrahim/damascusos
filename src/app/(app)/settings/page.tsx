import { requireSession } from '@/lib/auth';
import { getSettings } from '@/lib/data';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getSettings(session.userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">الإعدادات</h1>
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
        }}
      />
    </div>
  );
}