'use client';

import { useFormState } from 'react-dom';
import { loginAction, type LoginState } from './actions';
import { Alert, Button, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent-soft">
            <span className="text-lg font-semibold text-accent">D</span>
          </div>
          <h1 className="text-xl font-semibold text-fg">Damascus.webp OS</h1>
          <p className="mt-1 text-xs text-fg-secondary">سجّل الدخول للمتابعة</p>
        </header>

        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-line-subtle bg-surface p-6 shadow-2"
        >
          <Field label="اسم المستخدم" htmlFor="username" required>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              autoFocus
            />
          </Field>
          <Field label="كلمة المرور" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          {state?.error && <Alert tone="bad">{state.error}</Alert>}
          <Button type="submit" className="w-full">
            دخول
          </Button>
        </form>
      </div>
    </div>
  );
}