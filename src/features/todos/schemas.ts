import { z } from "zod";

export const createTodoSchema = z.object({
  text: z.string().min(1).max(500),
  attachmentKey: z.string().optional(),
});

export const toggleTodoSchema = z.object({
  id: z.string(),
});
