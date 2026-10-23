import { Schema, model, models, type InferSchemaType } from 'mongoose';

const DailyReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    obstacle: String,
    nextStep: String,
    notes: String,
  },
  { timestamps: true },
);

DailyReviewSchema.index({ userId: 1, date: 1 }, { unique: true });

export type DailyReviewDoc = InferSchemaType<typeof DailyReviewSchema>;
export const DailyReviewModel =
  models.DailyReview ?? model('DailyReview', DailyReviewSchema);