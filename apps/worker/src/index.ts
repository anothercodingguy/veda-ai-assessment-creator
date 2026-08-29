import mongoose from "mongoose";
import { Worker } from "bullmq";
import { GENERATION_QUEUE_NAME } from "@veda/shared";
import { config, redisConnection } from "./config.js";
import { AssignmentModel } from "./model.js";
import { publishAssignmentEvent } from "./events.js";
import { generateQuestionPaper } from "./generator.js";
import { renderQuestionPaperPdf } from "./pdf.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`[worker] connected to MongoDB at ${config.mongoUri}`);

  const worker = new Worker(
    GENERATION_QUEUE_NAME,
    async (job) => {
      const assignmentId = job.data.assignmentId as string;
      const assignment = await AssignmentModel.findById(assignmentId);
      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

      assignment.status = "processing";
      assignment.error = undefined;
      await assignment.save();
      await publishAssignmentEvent({
        assignmentId,
        status: "processing",
        message: "Generating question paper"
      });

      const result = await generateQuestionPaper(assignment.input);
      const pdf = await renderQuestionPaperPdf(result);

      assignment.result = result;
      assignment.pdf = pdf;
      assignment.status = "completed";
      assignment.error = undefined;
      await assignment.save();

      await publishAssignmentEvent({
        assignmentId,
        status: "completed",
        message: "Question paper is ready",
        result
      });
      await publishAssignmentEvent({
        assignmentId,
        status: "completed",
        message: "PDF is ready"
      });
    },
    {
      connection: redisConnection,
      concurrency: 2
    }
  );

  worker.on("failed", async (job, error) => {
    const assignmentId = job?.data.assignmentId as string | undefined;
    if (!assignmentId) return;
    await AssignmentModel.findByIdAndUpdate(assignmentId, {
      $set: { status: "failed", error: error.message }
    });
    await publishAssignmentEvent({
      assignmentId,
      status: "failed",
      message: error.message
    });
  });

  console.log(`[worker] listening on BullMQ queue ${GENERATION_QUEUE_NAME}`);
}

main().catch((error) => {
  console.error("[worker] fatal startup error", error);
  process.exit(1);
});
