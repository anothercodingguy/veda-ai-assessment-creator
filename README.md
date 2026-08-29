# VedaAI Assessment Creator

AI assessment creator built for the VedaAI full-stack assignment. The app lets a teacher create an assignment, enqueue AI question generation, watch real-time job updates, view a structured exam-paper output, regenerate, and download a formatted PDF.

## Stack

- Frontend: Next.js, TypeScript, Zustand, WebSocket client, lucide icons
- Backend: Node.js, Express, TypeScript, MongoDB, Redis, BullMQ, WebSocket
- Worker: BullMQ processor, Groq integration with deterministic fallback, PDFKit export
- Shared: Zod schemas and app-owned assignment/question-paper types

## Architecture

1. The Next.js form validates assignment metadata, question rows, marks, due date, optional upload, and instructions.
2. `POST /api/assignments` stores the assignment in MongoDB and adds a BullMQ generation job.
3. The worker marks the job as processing, builds a structured prompt, calls Groq when `GROQ_API_KEY` is available, otherwise uses deterministic fallback generation.
4. The worker validates the generated JSON with Zod, stores the structured result and PDF buffer in MongoDB, and publishes Redis events.
5. The API WebSocket bridge forwards Redis job events to subscribed browser clients.

Raw LLM output is never rendered. The UI only renders validated `QuestionPaper` data.

## Local Setup

```bash
npm install
cp .env.example .env
docker compose up -d mongo redis
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `GROQ_API_KEY`, generation still works using deterministic fallback content. With an API key, set `GROQ_API_KEY` and optionally `GROQ_MODEL` in `.env`.

The Vercel deployment includes same-origin Next.js API routes for a hosted demo. The Docker runtime remains the full-stack path with Express, MongoDB, Redis, BullMQ, and the worker.

## Docker Deployment

```bash
cp .env.example .env
docker compose up --build
```

Services:

- `web`: Next.js app on port `3000`
- `api`: Express/WebSocket server on port `4000`
- `worker`: BullMQ generation/PDF worker
- `mongo`: assignment and result persistence
- `redis`: BullMQ and pub/sub job events

## API

- `GET /api/assignments`
- `POST /api/assignments`
- `GET /api/assignments/:id`
- `POST /api/assignments/:id/regenerate`
- `GET /api/assignments/:id/pdf`

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Manual flow:

1. Create an assignment from the dashboard.
2. Watch queued/processing updates on the output page.
3. Confirm the paper renders as sections with difficulty and marks.
4. Regenerate the paper.
5. Download the PDF.
