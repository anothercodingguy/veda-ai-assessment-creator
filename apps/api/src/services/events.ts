import { Redis } from "ioredis";
import { ASSIGNMENT_EVENTS_CHANNEL, type AssignmentEvent } from "@veda/shared";
import { redisConnection } from "../config.js";

const publisher = new Redis(redisConnection);

export async function publishAssignmentEvent(event: AssignmentEvent) {
  await publisher.publish(ASSIGNMENT_EVENTS_CHANNEL, JSON.stringify(event));
}

export async function closeEventPublisher() {
  await publisher.quit();
}
