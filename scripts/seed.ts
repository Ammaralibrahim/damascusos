import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Damascus.webp OS — تهيئة المستخدم');
  console.log('════════════════════════════════════════\n');

  // ── 1) تشخيص البيئة ────────────────────────────────────
  const envPath = resolve(process.cwd(), '.env');
  console.log('[1/5] فحص البيئة');
  console.log('  cwd:', process.cwd());
  console.log('  .env موجود؟', existsSync(envPath));
  console.log('  .env.local موجود؟', existsSync(resolve(process.cwd(), '.env.local')));

  const uri = process.env.MONGODB_URI;
  const username = process.env.BOOTSTRAP_USERNAME;
  const password = process.env.BOOTSTRAP_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;

  console.log('  MONGODB_URI معرّف؟', !!uri, '| الطول:', uri?.length ?? 0);
  console.log('  BOOTSTRAP_USERNAME:', username ?? '(مفقود)');
  console.log('  BOOTSTRAP_PASSWORD معرّف؟', !!password, '| الطول:', password?.length ?? 0);
  console.log('  AUTH_SECRET معرّف؟', !!authSecret, '| الطول:', authSecret?.length ?? 0);

  if (!existsSync(envPath)) {
    console.error('\n✗ .env غير موجود في مجلد العمل الحالي.');
    console.error('  المطلوب: C:\\Users\\ammar\\Desktop\\damascus.webp\\.env');
    console.error('  انتقل إلى جذر المشروع ثم شغّل الأمر مجددًا.');
    process.exit(1);
  }
  if (!uri) {
    console.error('\n✗ MONGODB_URI مفقود من .env');
    process.exit(1);
  }
  if (!username || !password) {
    console.error('\n✗ BOOTSTRAP_USERNAME أو BOOTSTRAP_PASSWORD مفقود من .env');
    console.error('  أضف السطرين التاليين ثم أعد المحاولة:');
    console.error('    BOOTSTRAP_USERNAME="ammar"');
    console.error('    BOOTSTRAP_PASSWORD="كلمة-مرور-قوية"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error(`\n✗ BOOTSTRAP_PASSWORD قصيرة (${password.length} حرفًا). الحد الأدنى 10.`);
    process.exit(1);
  }
  if (!authSecret || authSecret.length < 32) {
    console.warn(`\n⚠ AUTH_SECRET ${authSecret ? `قصير (${authSecret.length})` : 'مفقود'} — تسجيل الدخول سيفشل بعد الـ seed.`);
    console.warn('  ولّد واحدًا جديدًا: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  }

  // ── 2) كشف قاعدة البيانات الافتراضية ────────────────────
  const uriAfterHost = uri.replace(/^mongodb(\+srv)?:\/\/[^/]+\/?/, '');
  const dbMatch = uriAfterHost.match(/^([^?]+)/);
  const dbNameFromUri = dbMatch?.[1] || '';
  const explicitDb = dbNameFromUri.length > 0;

  console.log('\n[2/5] الاتصال بقاعدة البيانات');
  if (!explicitDb) {
    console.warn('⚠ MONGODB_URI لا يحدد اسم قاعدة بيانات → سيُستخدم "test".');
    console.warn('  توصية: أضف اسمًا صريحًا، مثل: ...mongodb.net/damascus_os?...');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('  ✓ متصل. اسم قاعدة البيانات:', mongoose.connection.name);
  console.log('  host:', mongoose.connection.host);

  // ── 3) تعريف المخطط (مضمّن لتفادي مشاكل tsconfig في scripts/) ─
  console.log('\n[3/5] تجهيز النموذج');
  const SettingsSchema = new mongoose.Schema(
    {
      displayName: { type: String, default: 'عمار' },
      projectName: { type: String, default: 'Damascus.webp' },
      defaultSector: { type: String, default: 'عيادات الأسنان' },
      defaultMarket: { type: String, default: 'دمشق' },
      mainService: { type: String, default: 'موقع احترافي سريع ومتجاوب للعيادة' },
      workStartHour: { type: Number, default: 9 },
      workEndHour: { type: Number, default: 17 },
      workDays: { type: [Number], default: [0, 1, 2, 3, 4] },
      timezone: { type: String, default: 'Asia/Damascus' },
      currency: { type: String, default: 'SYP' },
      weeklyOutreachGoal: { type: Number, default: 10 },
      demoTimeLimitMinutes: { type: Number, default: 240 },
      inAppNotifications: { type: Boolean, default: true },
    },
    { _id: false },
  );

  const UserSchema = new mongoose.Schema(
    {
      username: { type: String, required: true, unique: true, index: true },
      passwordHash: { type: String, required: true },
      settings: { type: SettingsSchema, default: () => ({}) },
    },
    { timestamps: true },
  );

  const User = mongoose.models.User ?? mongoose.model('User', UserSchema);
  console.log('  ✓ النموذج جاهز.');

  // ── 4) التحقق من وجود المستخدم مسبقًا ──────────────────
  console.log('\n[4/5] التحقق من المستخدم الحالي');
  const existing = await User.findOne({ username }).lean();
  if (existing) {
    console.log(`  ℹ المستخدم "${username}" موجود بالفعل.`);
    console.log(`    _id: ${existing._id}`);
    console.log(`    passwordHash يبدأ بـ: ${existing.passwordHash.slice(0, 10)}…`);
    console.log(`    created: ${new Date((existing as any).createdAt).toISOString()}`);
    console.log('\n  لإعادة تعيين كلمة المرور:');
    console.log(`    pnpm reset-password ${username} "كلمة-جديدة"`);
    await mongoose.disconnect();
    process.exit(0);
  }
  console.log('  لا يوجد مستخدم بهذا الاسم. سيُنشأ الآن.');

  // ── 5) الإنشاء والتحقق ────────────────────────────────
  console.log('\n[5/5] إنشاء المستخدم');
  const passwordHash = await bcrypt.hash(password, 12);
  console.log('  ✓ تم توليد hash (bcrypt cost=12).');

  const created = await User.create({ username, passwordHash });
  console.log('  ✓ تم الإنشاء في قاعدة البيانات.');

  // تحقق فوري أن الدخول سيعمل
  console.log('\n  التحقق من كلمة المرور...');
  const verify = await bcrypt.compare(password, created.passwordHash);
  if (!verify) {
    console.error('  ✗ فشل التحقق! مشكلة حرجة في التشفير.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('  ✓ كلمة المرور صحيحة.');

  // ── ملخص نهائي ────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('  ✓ نجح إنشاء المستخدم');
  console.log('════════════════════════════════════════');
  console.log('  username :', username);
  console.log('  database :', mongoose.connection.name);
  console.log('  _id      :', String(created._id));
  console.log('\n  الخطوات التالية:');
  console.log('    1. احذف BOOTSTRAP_PASSWORD من .env (لم يعد لزوم له)');
  console.log('    2. شغّل: pnpm dev');
  console.log('    3. افتح http://localhost:3000/login');
  console.log(`    4. اسم المستخدم: ${username}`);
  console.log('    5. كلمة المرور: (نفس BOOTSTRAP_PASSWORD التي استخدمتها)');
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n════════════════════════════════════════');
  console.error('  ✗ فشل الـ seed');
  console.error('════════════════════════════════════════');

  const msg = err instanceof Error ? err.message : String(err);

  if (/bad auth|Authentication failed/i.test(msg)) {
    console.error('السبب: كلمة مرور MongoDB خاطئة.');
    console.error('الحل  : بدّل كلمة المرور في Atlas وحدّث MONGODB_URI (مع ترميز URL).');
  } else if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
    console.error('السبب: تعذّر الوصول إلى MongoDB host.');
    console.error('الحل  : تحقق من اتصال الإنترنت ومن اسم cluster في URI.');
  } else if (/IP|whitelist|not allowed/i.test(msg)) {
    console.error('السبب: عنوان IP الحالي غير مسموح في Atlas.');
    console.error('الحل  : Atlas → Network Access → Add IP Address');
    console.error('        (احصل على IP الحالي: (Invoke-RestMethod https://api.ipify.org?format=json).ip)');
  } else if (/E11000|duplicate key/i.test(msg)) {
    console.error('السبب: مستخدم بنفس الاسم موجود (تعارض فهرس unique).');
    console.error('الحل  : استخدم reset-password بدلًا من seed.');
  } else {
    console.error('السبب:', msg);
    if (err instanceof Error && err.stack) {
      console.error('\nStack:');
      console.error(err.stack.split('\n').slice(0, 6).join('\n'));
    }
  }
  console.error('════════════════════════════════════════\n');

  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});