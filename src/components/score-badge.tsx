import { Badge } from './ui';

export function ScoreBadge({ total, complete }: { total: number; complete: boolean }) {
  if (!complete) return <Badge tone="neutral">غير مكتمل</Badge>;
  const tone = total >= 70 ? 'ok' : total >= 40 ? 'warn' : 'bad';
  return <Badge tone={tone}>{total}/100</Badge>;
}