import { Schema, model, models, type InferSchemaType } from 'mongoose';

const FollowUpSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
    dueAt: { type: Date, index: true },
    note: { type: String, required: true },
    status: { type: String, enum: ['open', 'done', 'cancelled'], default: 'open', index: true },
    doneAt: Date,
  },
  { timestamps: true },
);

export type FollowUpDoc = InferSchemaType<typeof FollowUpSchema>;
export const FollowUpModel = models.FollowUp ?? model('FollowUp', FollowUpSchema);