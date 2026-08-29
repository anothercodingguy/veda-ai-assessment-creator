import mongoose, { Schema } from "mongoose";
import type { AssignmentInput, GenerationStatus, QuestionPaper } from "@veda/shared";

export interface AssignmentDocument extends mongoose.Document {
  input: AssignmentInput;
  status: GenerationStatus;
  result?: QuestionPaper;
  error?: string;
  pdf?: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<AssignmentDocument>(
  {
    input: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["draft", "queued", "processing", "completed", "failed"],
      default: "draft",
      index: true
    },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    pdf: { type: Buffer }
  },
  { timestamps: true }
);

assignmentSchema.index({ createdAt: -1 });

export const AssignmentModel =
  mongoose.models.Assignment ||
  mongoose.model<AssignmentDocument>("Assignment", assignmentSchema);
