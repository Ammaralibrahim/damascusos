# Damascus.webp OS

نظام شخصي لإدارة الوقت والعملاء والمبيعات لـ عمار — Damascus.webp.

## التشغيل

```bash
cp .env.example .env
# عدّل MONGODB_URI و AUTH_SECRET (openssl rand -base64 48)
pnpm install
pnpm seed       # مرة واحدة
pnpm dev        # http://localhost:3000