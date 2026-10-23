'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sun, Stethoscope, CalendarClock, Settings } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/', label: 'لوحة القيادة', icon: Home },
  { href: '/today', label: 'يومي', icon: Sun },
  { href: '/clinics', label: 'العيادات', icon: Stethoscope },
  { href: '/followups', label: 'المتابعات', icon: CalendarClock },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`group flex h-10 items-center gap-2.5 rounded-md border px-3 text-sm transition-colors duration-fast ${
              active
                ? 'border-accent/30 bg-accent-soft font-medium text-accent'
                : 'border-transparent text-fg-secondary hover:bg-subtle hover:text-fg'
            }`}
          >
            <Icon
              size={16}
              strokeWidth={active ? 2 : 1.75}
              className={active ? 'text-accent' : 'text-fg-tertiary group-hover:text-fg'}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line-subtle bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[10px] transition-colors duration-fast ${
                  active ? 'font-medium text-accent' : 'text-fg-tertiary'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}