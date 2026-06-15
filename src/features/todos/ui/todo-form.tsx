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
import { createTodo } from "../actions/create-todo";
import { getUploadUrl } from "../actions/get-upload-url";
import { createTodoSchema } from "../schemas";

type FormValues = z.infer<typeof createTodoSchema>;

export function TodoForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { text: "" },
  });

  const { execute, isPending } = useAction(createTodo, {
    onSuccess: () => {
      form.reset();
      setSelectedFile(null);
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

  async function onSubmit(values: FormValues) {
    if (selectedFile) {
      const result = await executeGetUrl({ filename: selectedFile.name, contentType: selectedFile.type });
      if (result?.data) {
        await fetch(result.data.url, { method: "PUT", body: selectedFile });
        values.attachmentKey = result.data.key;
      }
    }
    execute(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="space-y-1">
        <Label htmlFor="text">New todo</Label>
        <Input id="text" placeholder="What needs to be done?" {...form.register("text")} />
        {form.formState.errors.text && <p className="text-destructive text-sm">{form.formState.errors.text.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="attachment">Attachment (optional)</Label>
        <Input id="attachment" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
      </div>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Adding..." : "Add todo"}
      </Button>
    </form>
  );
}
