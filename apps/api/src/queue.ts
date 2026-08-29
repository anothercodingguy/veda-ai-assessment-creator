import { Queue } from "bullmq";
import { GENERATION_QUEUE_NAME } from "@veda/shared";
import { redisConnection } from "./config.js";

export const generationQueue = new Queue(GENERATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 1500 },
    removeOnComplete: { age: 60 * 60 * 24, count: 500 },
    removeOnFail: { age: 60 * 60 * 24 * 7, count: 1000 }
  }
});

export async function addGenerationJob(assignmentId: string) {
  return generationQueue.add("generate-assessment", { assignmentId }, { jobId: `assignment:${assignmentId}:${Date.now()}` });
}
