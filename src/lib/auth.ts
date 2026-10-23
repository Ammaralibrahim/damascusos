import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { connectDb } from './db';
import { UserModel } from '@/models/User';
import { AppError } from './errors';

const COOKIE = 'dw_session';
const secretEnv = process.env.AUTH_SECRET;
if (!secretEnv || secretEnv.length < 32) {
  throw new Error('AUTH_SECRET يجب أن يكون 32 حرفًا على الأقل.');
}
const secret = new TextEncoder().encode(secretEnv);

export type Session = { userId: string; username: string };

export async function createSession(payload: Session): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE);
}

export async function readSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== 'string' || typeof payload.username !== 'string') {
      return null;
    }
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const s = await readSession();
  if (!s) throw new AppError('يجب تسجيل الدخول.', 'UNAUTHENTICATED', 401);
  return s;
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<Session | null> {
  await connectDb();
  const user = await UserModel.findOne({ username: username.trim() }).lean();
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { userId: String(user._id), username: user.username };
}