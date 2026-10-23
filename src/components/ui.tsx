import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';

/* ============================================================
   CARD
   ============================================================ */
export function Card({
  children,
  className = '',
  padding = 'md',
  inset = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  inset?: boolean;
}) {
  const pad = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' } as const;
  return (
    <div
      className={`rounded-lg border border-line-subtle ${inset ? 'bg-surface-2' : 'bg-surface'} ${pad[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'accent' | 'ok' | 'warn' | 'bad';
}) {
  const tones = {
    default: 'text-fg',
    accent: 'text-accent',
    ok: 'text-ok',
    warn: 'text-warn',
    bad: 'text-bad',
  } as const;
  return (
    <div className="rounded-lg border border-line-subtle bg-surface p-4">
      <div className="text-xs text-fg-tertiary">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-fg-tertiary">{hint}</div>}
    </div>
  );
}

/* ============================================================
   BUTTON
   ============================================================ */
type ButtonVariant =
  | 'primary'
  | 'primary-soft'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'accent';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    children,
    className = '',
    disabled,
    ...rest
  },
  ref,
) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-accent text-fg-inverse border border-accent shadow-1 hover:bg-accent-hover active:translate-y-px active:shadow-none',
    'primary-soft':
      'bg-accent-soft text-accent border border-accent/50 shadow-1 hover:bg-accent/20 active:translate-y-px active:shadow-none',
    secondary:
      'bg-surface text-fg border border-line-strong shadow-1 hover:bg-surface-2 hover:border-fg/40 active:translate-y-px active:shadow-none',
    ghost:
      'bg-surface-2/50 text-fg-secondary border border-line hover:bg-surface-2 hover:text-fg active:translate-y-px',
    danger:
      'bg-surface text-bad border border-bad/40 shadow-1 hover:bg-bad-bg active:translate-y-px active:shadow-none',
    accent:
      'bg-accent text-fg-inverse border border-accent shadow-1 hover:bg-accent-hover active:translate-y-px active:shadow-none',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-fast disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {trailingIcon}
    </button>
  );
});

/* ============================================================
   ICON BUTTON
   ============================================================ */
type IconButtonTone = 'neutral' | 'danger' | 'primary' | 'accent';
type IconButtonSize = 'sm' | 'md';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  loading?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = 'neutral', size = 'md', loading, className = '', disabled, children, ...rest },
  ref,
) {
  const tones: Record<IconButtonTone, string> = {
    neutral:
      'bg-surface text-fg border border-line-strong shadow-1 hover:bg-surface-2 hover:border-fg/40 active:translate-y-px active:shadow-none',
    danger:
      'bg-surface text-bad border border-bad/40 shadow-1 hover:bg-bad-bg active:translate-y-px active:shadow-none',
    primary:
      'bg-accent text-fg-inverse border border-accent shadow-1 hover:bg-accent-hover active:translate-y-px active:shadow-none',
    accent:
      'bg-accent text-fg-inverse border border-accent shadow-1 hover:bg-accent-hover active:translate-y-px active:shadow-none',
  };
  const sizes: Record<IconButtonSize, string> = {
    sm: 'h-7 w-7 rounded-md',
    md: 'h-8 w-8 rounded-md',
  };
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-[background-color,color,border-color,box-shadow,transform] duration-fast disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        children
      )}
    </button>
  );
});

/* ============================================================
   INPUT / SELECT / TEXTAREA
   ============================================================ */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`h-9 w-full rounded-md border border-line bg-input px-3 text-sm text-fg placeholder:text-fg-tertiary transition-[border-color,box-shadow] duration-fast hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-subtle disabled:text-fg-tertiary ${className}`}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={`h-9 w-full appearance-none rounded-md border border-line bg-input bg-[length:14px] bg-[left_12px_center] bg-no-repeat px-3 pl-8 text-sm text-fg transition-[border-color,box-shadow] duration-fast hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-subtle disabled:text-fg-tertiary ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23a8a9ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
        }}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = '', ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-line bg-input px-3 py-2 text-sm text-fg placeholder:text-fg-tertiary transition-[border-color,box-shadow] duration-fast hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-subtle disabled:text-fg-tertiary ${className}`}
      {...rest}
    />
  );
});

/* ============================================================
   FIELD
   ============================================================ */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-fg-secondary">
        {label}
        {required && <span className="ms-0.5 text-bad">*</span>}
      </label>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-bad">
          {error}
        </span>
      )}
      {!error && hint && (
        <span className="mt-1.5 block text-xs text-fg-tertiary">{hint}</span>
      )}
    </div>
  );
}

/* ============================================================
   BADGE
   ============================================================ */
type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'info' | 'primary';
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-subtle text-fg-secondary border-line',
    accent: 'bg-accent-soft text-accent border-accent/30',
    primary: 'bg-primary-soft text-primary border-primary/30',
    ok: 'bg-ok-bg text-ok border-ok/30',
    warn: 'bg-warn-bg text-warn border-warn/30',
    bad: 'bg-bad-bg text-bad border-bad/30',
    info: 'bg-info-bg text-info border-info/30',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ============================================================
   ALERT
   ============================================================ */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: 'info' | 'ok' | 'warn' | 'bad';
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    info: 'border-info/30 bg-info-bg text-info',
    ok: 'border-ok/30 bg-ok-bg text-ok',
    warn: 'border-warn/30 bg-warn-bg text-warn',
    bad: 'border-bad/30 bg-bad-bg text-bad',
  } as const;
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${tones[tone]}`}>
      <div className="flex-1">
        {title && <p className="text-sm font-medium">{title}</p>}
        <div className={title ? 'mt-0.5 text-xs opacity-90' : 'text-sm'}>{children}</div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   EMPTY
   ============================================================ */
export function Empty({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
      {icon && <div className="mb-3 text-fg-tertiary">{icon}</div>}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-fg-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ============================================================
   LOADING
   ============================================================ */
export function LoadingState({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-sm text-fg-secondary">
      <span
        aria-hidden
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      />
      {label}
    </div>
  );
}

/* ============================================================
   SECTION
   ============================================================ */
export function Section({
  title,
  description,
  action,
  children,
  divided = true,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  divided?: boolean;
}) {
  return (
    <section
      className={`space-y-3 ${divided ? 'border-t border-line-subtle pt-6 first:border-0 first:pt-0' : ''}`}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-md font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-fg-secondary">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}