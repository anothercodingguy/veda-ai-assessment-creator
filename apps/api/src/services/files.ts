import pdfParse from "pdf-parse";

const MAX_SOURCE_CHARS = 24_000;

export async function extractUploadText(file?: Express.Multer.File) {
  if (!file) return "";

  if (file.mimetype === "text/plain" || file.originalname.toLowerCase().endsWith(".txt")) {
    return file.buffer.toString("utf8").slice(0, MAX_SOURCE_CHARS);
  }

  if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(file.buffer);
    return parsed.text.slice(0, MAX_SOURCE_CHARS);
  }

  return "";
}
