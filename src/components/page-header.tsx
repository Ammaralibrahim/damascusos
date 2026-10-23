import type { ReactNode } from 'react';

export function PageHeader({
  overline,
  title,
  description,
  actions,
  breadcrumb,
}: {
  overline?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {breadcrumb && <div className="text-xs text-fg-tertiary">{breadcrumb}</div>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          {overline && <p className="text-xs text-fg-tertiary">{overline}</p>}
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && <div className="mt-1 text-sm text-fg-secondary">{description}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}