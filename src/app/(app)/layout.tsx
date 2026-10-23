import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { getSettings } from '@/lib/data';
import { Sidebar, BottomNav } from '@/components/nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from './logout-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const settings = await getSettings(session.userId);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-6xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-l border-line-subtle bg-surface py-6 md:block">
          <div className="px-4">
            <Link
              href="/"
              className="mb-6 block rounded-md p-2 -m-2 transition-colors duration-fast hover:bg-subtle"
            >
              <span className="text-sm font-semibold text-fg">{settings.projectName}</span>
              <span className="block text-[11px] text-fg-tertiary">نظام عمار الشخصي</span>
            </Link>
            <Sidebar />
          </div>
          <div className="mt-8 border-t border-line-subtle px-4 pt-4">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-fg-tertiary">
              الحساب
            </div>
            <div className="text-xs text-fg-secondary">{settings.displayName}</div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-line-subtle bg-canvas/85 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-2 px-4 md:px-8">
              <span className="text-sm font-semibold text-fg md:hidden">
                {settings.projectName}
              </span>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <LogoutButton />
              </div>
            </div>
          </header>

          <main className="px-4 pb-24 pt-8 md:px-8 md:pb-12">
            <div className="mx-auto max-w-3xl">{children}</div>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}