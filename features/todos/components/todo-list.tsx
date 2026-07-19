"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteCompletedTodos, deleteTodo, getDownloadUrl, toggleTodo } from "@/features/todos/actions";
import type { Todo } from "@/features/todos/data";
import { Paperclip, Trash2 } from "lucide-react";
import { useAction, useOptimisticAction } from "next-safe-action/hooks";
import { toast } from "sonner";

function serverErrorToast({ error }: { error: { serverError?: string } }) {
  if (error.serverError) toast.error(error.serverError);
}

export function TodoList({ todos }: { todos: Todo[] }) {
  // Toggle is a pure mutation → optimistic. Create/delete have side effects → plain useAction.
  const { execute: executeToggle, optimisticState } = useOptimisticAction(toggleTodo, {
    currentState: todos,
    updateFn: (state, input) =>
      state.map((todo) => (todo.id === input.id ? { ...todo, completed: !todo.completed } : todo)),
    onError: serverErrorToast,
  });

  const { execute: executeDelete } = useAction(deleteTodo, { onError: serverErrorToast });
  const { execute: executeDeleteCompleted, isPending: isDeletingCompleted } = useAction(deleteCompletedTodos, {
    onError: serverErrorToast,
  });

  async function downloadAttachment(key: string) {
    const result = await getDownloadUrl({ key });
    if (!result?.data) {
      toast.error(result?.serverError ?? "Could not download the attachment");
      return;
    }
    window.open(result.data.url, "_blank", "noopener");
  }

  const completedCount = optimisticState.filter((todo) => todo.completed).length;

  if (optimisticState.length === 0) {
    return <p className="text-muted-foreground text-sm">No todos yet — add your first one above.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y">
        {optimisticState.map((todo) => (
          <li key={todo.id} className="flex items-center gap-3 py-3">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => executeToggle({ id: todo.id })}
              aria-label={`Mark "${todo.text}" as ${todo.completed ? "not done" : "done"}`}
            />
            <span className={`flex-1 text-sm ${todo.completed ? "text-muted-foreground line-through" : ""}`}>
              {todo.text}
            </span>
            {todo.attachmentKey ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => todo.attachmentKey && downloadAttachment(todo.attachmentKey)}
              >
                <Paperclip className="size-4" />
                <span className="sr-only">Download attachment</span>
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" onClick={() => executeDelete({ id: todo.id })}>
              <Trash2 className="size-4" />
              <span className="sr-only">Delete todo</span>
            </Button>
          </li>
        ))}
      </ul>
      {completedCount > 0 ? (
        <Button
          variant="outline"
          onClick={() => executeDeleteCompleted()}
          disabled={isDeletingCompleted}
          className="self-start"
        >
          Delete completed ({completedCount})
        </Button>
      ) : null}
    </div>
  );
}
