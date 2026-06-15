"use server";

import { authActionClient } from "@/lib/safe-action";
import { getPresignedUploadUrl } from "@/lib/storage";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

export const getUploadUrl = authActionClient
  .inputSchema(z.object({ filename: z.string(), contentType: z.string() }))
  .action(async ({ parsedInput }) => {
    const key = `uploads/${createId()}-${parsedInput.filename}`;
    const url = await getPresignedUploadUrl(key);
    return { url, key };
  });
