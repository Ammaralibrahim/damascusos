'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import {
  markFollowUpDoneAction,
  postponeFollowUpAction,
  cancelFollowUpAction,
} from './actions';

export function FollowUpActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <IconButton
        label="إكمال"
        tone="primary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await markFollowUpDoneAction(id);
            if (r.ok) router.refresh();
          })
        }
      >
        <Check size={13} strokeWidth={2.5} />
      </IconButton>
      <IconButton
        label="تأجيل يومًا"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await postponeFollowUpAction(id, 1);
            if (r.ok) router.refresh();
          })
        }
      >
        <Clock size={13} strokeWidth={2} />
      </IconButton>
      <IconButton
        label="إلغاء"
        tone="danger"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await cancelFollowUpAction(id);
            if (r.ok) router.refresh();
          })
        }
      >
        <X size={13} strokeWidth={2.5} />
      </IconButton>
    </div>
  );
}