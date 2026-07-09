"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createTodo, getUploadUrl } from "../actions";
import { createTodoSchema } from "../schemas";

type FormValues = z.infer<typeof createTodoSchema>;

export function TodoForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { text: "" },
  });

  const { execute, isPending } = useAction(createTodo, {
    onSuccess: () => {
      form.reset();
      setSelectedFile(null);
      setFileInputKey((key) => key + 1);
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        for (const [field, messages] of Object.entries(error.validationErrors)) {
          form.setError(field as never, { message: (messages as { _errors?: string[] })?._errors?.[0] });
        }
      } else if (error.serverError) {
        toast.error(error.serverError);
      }
    },
  });

  const { executeAsync: executeGetUrl } = useAction(getUploadUrl, {
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to get upload URL"),
  });

  async function uploadAttachment(file: File) {
    const result = await executeGetUrl({ filename: file.name, contentType: file.type });

    if (!result?.data) {
      throw new Error(result?.serverError ?? "Failed to get upload URL");
    }

    const response = await fetch(result.data.url, {
      method: "PUT",
      body: file,
      headers: file.type ? { "Content-Type": file.type } : undefined,
    });

    if (!response.ok) {
      throw new Error("Failed to upload attachment");
    }

    return result.data.key;
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsUploading(Boolean(selectedFile));
      const attachmentKey = selectedFile ? await uploadAttachment(selectedFile) : undefined;
      execute({ ...values, attachmentKey });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to upload attachment");
      }
    } finally {
      setIsUploading(false);
    }
  }

  const isSubmitting = isPending || isUploading || form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="space-y-1">
        <Label htmlFor="text">New todo</Label>
        <Input id="text" placeholder="What needs to be done?" disabled={isSubmitting} {...form.register("text")} />
        {form.formState.errors.text && <p className="text-destructive text-sm">{form.formState.errors.text.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="attachment">Attachment (optional)</Label>
        <Input
          key={fileInputKey}
          id="attachment"
          type="file"
          disabled={isSubmitting}
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isUploading ? "Uploading..." : isPending ? "Adding..." : "Add todo"}
      </Button>
    </form>
  );
}
