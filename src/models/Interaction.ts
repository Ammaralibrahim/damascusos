import { Schema, model, models, type InferSchemaType } from 'mongoose';

const InteractionSchema = new Schema(
  {
    clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    type: {
      type: String,
      enum: ['call', 'message', 'reply', 'meeting', 'demo', 'quote', 'followup', 'note'],
      required: true,
    },
    occurredAt: { type: Date, required: true, index: true },
    summary: { type: String, required: true },
    outcome: String,
    nextStep: String,
    followUpAt: Date,
  },
  { timestamps: true },
);

export type InteractionDoc = InferSchemaType<typeof InteractionSchema>;
export const InteractionModel =
  models.Interaction ?? model('Interaction', InteractionSchema);