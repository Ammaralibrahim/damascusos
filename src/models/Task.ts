import { Schema, model, models, type InferSchemaType } from 'mongoose';

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    kind: {
      type: String,
      enum: ['research', 'outreach', 'dev', 'admin', 'learning', 'review'],
      default: 'admin',
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done', 'postponed', 'cancelled'],
      default: 'todo',
      index: true,
    },
    estimatedMinutes: { type: Number, min: 5, max: 600 },
    deadline: Date,
    scheduledFor: { type: Date, index: true },
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic' },
    notes: String,
    completedAt: Date,
  },
  { timestamps: true },
);

export type TaskDoc = InferSchemaType<typeof TaskSchema>;
export const TaskModel = models.Task ?? model('Task', TaskSchema);