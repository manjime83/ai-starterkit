"use server";

import { authActionClient } from "@/lib/safe-action";
import { getPresignedDownloadUrl } from "@/lib/storage";
import { z } from "zod";

export const getDownloadUrl = authActionClient
  .inputSchema(z.object({ key: z.string() }))
  .action(async ({ parsedInput }) => {
    const url = await getPresignedDownloadUrl(parsedInput.key);
    return { url };
  });
