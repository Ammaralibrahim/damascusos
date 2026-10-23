import { Schema, model, models, type InferSchemaType } from 'mongoose';

const SettingsSchema = new Schema(
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

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    settings: { type: SettingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const UserModel = models.User ?? model('User', UserSchema);