import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.error('الاستخدام: pnpm reset-password <username> <new-password>');
    process.exit(1);
  }
  if (newPassword.length < 10) {
    console.error('✗ كلمة المرور يجب أن تكون 10 أحرف على الأقل.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('✗ MONGODB_URI مفقود في .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('متصل بـ:', mongoose.connection.name);

  // جمع (collection) "users" مباشرة — لا حاجة لتحميل النموذج
  const users = mongoose.connection.collection('users');
  const existing = await users.findOne({ username });
  if (!existing) {
    console.error(`✗ المستخدم "${username}" غير موجود في قاعدة "${mongoose.connection.name}".`);
    console.error('  شغّل: pnpm seed لإنشائه.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await users.updateOne({ username }, { $set: { passwordHash } });
  if (result.modifiedCount !== 1) {
    console.error('✗ فشل التحديث.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // تحقق من التحديث
  const updated = await users.findOne({ username });
  const ok = updated && (await bcrypt.compare(newPassword, updated.passwordHash as string));
  if (!ok) {
    console.error('✗ التحقق من كلمة المرور الجديدة فشل — لم تُحدَّث!');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✓ تم تحديث كلمة مرور "${username}".`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('✗ فشل:', err instanceof Error ? err.message : err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});