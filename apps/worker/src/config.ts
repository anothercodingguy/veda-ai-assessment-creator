import dotenv from "dotenv";

dotenv.config();

export const config = {
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/veda-ai",
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
};

export const redisConnection = {
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null
};
