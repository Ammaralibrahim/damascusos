import { Schema, model, models, type InferSchemaType } from 'mongoose';
import { normalizePhone } from '@/lib/phone';

const DigitalAssessment = new Schema(
  {
    hasWebsite: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    mobileFriendly: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    servicesClear: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    basicInfoPresent: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    bookingPresent: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    contactClear: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    observedIssue: String,
    suggestedImprovement: String,
  },
  { _id: false },
);

const Scores = new Schema(
  {
    problem: { type: Number, default: 0, min: 0, max: 25 },
    fit: { type: Number, default: 0, min: 0, max: 20 },
    access: { type: Number, default: 0, min: 0, max: 15 },
    interest: { type: Number, default: 0, min: 0, max: 25 },
    nextStep: { type: Number, default: 0, min: 0, max: 15 },
    complete: { type: Boolean, default: false },
  },
  { _id: false },
);

const ClinicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    clinicType: { type: String, index: true },
    doctorName: String,
    city: String,
    area: { type: String, index: true },
    phone: String,
    phoneNormalized: { type: String, index: true },
    website: String,
    social: String,
    source: String,
    digital: { type: DigitalAssessment, default: () => ({}) },
    scores: { type: Scores, default: () => ({}) },
    stage: {
      type: String,
      enum: [
        'new',
        'verifying',
        'qualified',
        'contacted',
        'awaiting_reply',
        'initial_interest',
        'discussing',
        'demo',
        'quote',
        'negotiation',
        'won',
        'paid',
        'not_interested',
        'future_followup',
      ],
      default: 'new',
      index: true,
    },
    lostReason: String,
    lastContactAt: Date,
    notes: String,
  },
  { timestamps: true },
);

ClinicSchema.pre('save', function setPhoneNorm(next) {
  if (this.isModified('phone')) {
    this.phoneNormalized = this.phone
      ? normalizePhone(this.phone) ?? undefined
      : undefined;
  }
  next();
});

export type ClinicDoc = InferSchemaType<typeof ClinicSchema>;
export const ClinicModel = models.Clinic ?? model('Clinic', ClinicSchema);