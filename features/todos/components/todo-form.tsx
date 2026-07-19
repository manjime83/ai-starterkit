"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTodo, getUploadUrl } from "@/features/todos/actions";
import { createTodoSchema, getUploadUrlSchema } from "@/features/todos/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = createTodoSchema.pick({ text: true });
type FormValues = z.infer<typeof formSchema>;

export function TodoForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: "" },
  });

  const { execute, isPending } = useAction(createTodo, {
    onSuccess: () => {
      form.reset();
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        for (const [field, messages] of Object.entries(error.validationErrors)) {
          const message = Array.isArray(messages) ? messages[0] : messages?._errors?.[0];
          form.setError(field as never, { message });
        }
      } else if (error.serverError) {
        toast.error(error.serverError);
      }
    },
  });

  async function onSubmit(values: FormValues) {
    setFileError(null);
    let attachmentKey: string | undefined;

    if (file) {
      const parsed = getUploadUrlSchema.safeParse({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      if (!parsed.success) {
        setFileError(parsed.error.issues[0]?.message ?? "Invalid file");
        return;
      }

      setUploading(true);
      try {
        const result = await getUploadUrl(parsed.data);
        if (!result?.data) {
          setFileError(result?.serverError ?? "Could not prepare the upload");
          return;
        }

        const upload = await fetch(result.data.url, {
          method: "PUT",
          headers: result.data.headers,
          body: file,
        });
        if (!upload.ok) {
          toast.error("Upload failed");
          return;
        }

        attachmentKey = result.data.key;
      } finally {
        setUploading(false);
      }
    }

    execute({ text: values.text, attachmentKey });
  }

  const busy = uploading || isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="todo-text">New todo</Label>
        <Input id="todo-text" placeholder="What needs doing?" {...form.register("text")} />
        {form.formState.errors.text ? (
          <p className="text-destructive text-sm">{form.formState.errors.text.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="todo-attachment">Attachment (optional — JPEG, PNG, or PDF, max 10 MB)</Label>
        <Input
          id="todo-attachment"
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        {fileError ? <p className="text-destructive text-sm">{fileError}</p> : null}
      </div>
      <Button type="submit" disabled={busy} className="self-start">
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        Add todo
      </Button>
    </form>
  );
}
