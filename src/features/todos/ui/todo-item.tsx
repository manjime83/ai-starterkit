"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { todos } from "@/db/schema";
import { getPresignedDownloadUrl } from "@/lib/storage";
import type { InferSelectModel } from "drizzle-orm";
import { useOptimisticAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { toggleTodo } from "../actions/toggle-todo";

type Todo = InferSelectModel<typeof todos>;

export function TodoItem({ todo }: { todo: Todo }) {
  const { execute, optimisticState } = useOptimisticAction(toggleTodo, {
    currentState: todo,
    updateFn: (state) => ({ ...state, completed: !state.completed }),
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to toggle todo"),
  });

  async function handleAttachmentClick() {
    if (!todo.attachmentKey) return;
    const url = await getPresignedDownloadUrl(todo.attachmentKey);
    window.open(url, "_blank");
  }

  return (
    <li className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox checked={optimisticState.completed} onCheckedChange={() => execute({ id: todo.id })} />
      <span className={optimisticState.completed ? "text-muted-foreground line-through" : ""}>{todo.text}</span>
      {todo.attachmentKey && (
        <button onClick={handleAttachmentClick} className="text-primary ml-auto text-sm underline">
          View attachment
        </button>
      )}
    </li>
  );
}
