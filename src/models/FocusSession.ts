import { Schema, model, models, type InferSchemaType } from 'mongoose';

const FocusSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    startedAt: { type: Date, required: true, index: true },
    endedAt: Date,
    durationMinutes: Number,
  },
  { timestamps: true },
);

export type FocusSessionDoc = InferSchemaType<typeof FocusSessionSchema>;
export const FocusSessionModel =
  models.FocusSession ?? model('FocusSession', FocusSessionSchema);