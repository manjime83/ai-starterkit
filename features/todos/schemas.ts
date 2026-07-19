import { z } from "zod";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const attachmentContentTypes = ["image/jpeg", "image/png", "application/pdf"] as const;

export const createTodoSchema = z.object({
  text: z.string().min(1).max(500),
  attachmentKey: z.string().optional(),
});

export const getUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(attachmentContentTypes),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const toggleTodoSchema = z.object({
  id: z.string(),
});

export const deleteTodoSchema = z.object({
  id: z.string(),
});

export const getDownloadUrlSchema = z.object({
  key: z.string().min(1),
});
