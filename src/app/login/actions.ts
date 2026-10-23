'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { verifyCredentials, createSession } from '@/lib/auth';
import { toUserMessage } from '@/lib/errors';

const Schema = z.object({
  username: z.string().trim().min(1, 'أدخل اسم المستخدم'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});

export type LoginState = { error?: string } | null;

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = Schema.safeParse({
    username: form.get('username'),
    password: form.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' };
  }
  try {
    const session = await verifyCredentials(parsed.data.username, parsed.data.password);
    if (!session) return { error: 'بيانات الدخول غير صحيحة.' };
    await createSession(session);
  } catch (err) {
    return { error: toUserMessage(err) };
  }
  redirect('/');
}