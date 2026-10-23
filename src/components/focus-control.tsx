'use client';

import { useEffect, useState, useTransition } from 'react';
import { Play, Square } from 'lucide-react';
import { IconButton } from '@/components/ui';
import {
  startFocusSessionAction,
  stopFocusSessionAction,
} from '@/app/(app)/today/actions';

type ActiveSession = { _id: string; taskId: string; startedAt: string };

export function FocusControl({
  taskId,
  activeSession,
}: {
  taskId: string;
  activeSession: ActiveSession | null;
}) {
  const isForThisTask = activeSession?.taskId === taskId;
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!activeSession) return;
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [activeSession]);

  if (!mounted) {
    return <span className="text-xs text-fg-tertiary tabular">--:--</span>;
  }

  if (isForThisTask && activeSession) {
    const elapsedSec = Math.max(
      0,
      Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000),
    );
    const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const ss = String(elapsedSec % 60).padStart(2, '0');
    return (
      <div className="flex items-center gap-1.5">
        <span className="rounded-md border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent tabular">
          {mm}:{ss}
        </span>
        <IconButton
          label="إيقاف التركيز"
          size="sm"
          tone="neutral"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await stopFocusSessionAction(activeSession._id);
              if (!r.ok) setError(r.error);
            })
          }
        >
          <Square size={11} strokeWidth={2.5} />
        </IconButton>
        {error && <span className="text-[10px] text-bad">{error}</span>}
      </div>
    );
  }

  if (activeSession) {
    return <span className="text-[11px] text-fg-tertiary">جلسة على مهمة أخرى</span>;
  }

  return (
    <IconButton
      label="ابدأ التركيز"
      size="sm"
      tone="neutral"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await startFocusSessionAction(taskId);
          if (!r.ok) setError(r.error);
        })
      }
    >
      <Play size={11} strokeWidth={2.5} />
    </IconButton>
  );
}