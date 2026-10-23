'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutAction } from './logout-action';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await logoutAction();
        router.push('/login');
        router.refresh();
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-fg-secondary transition-colors duration-fast hover:bg-hover hover:text-fg"
    >
      <LogOut size={14} strokeWidth={1.75} />
      خروج
    </button>
  );
}