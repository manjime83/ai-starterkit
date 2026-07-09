"use client";

import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { deleteCompletedTodosAction } from "../actions";

export function DeleteCompletedButton({ completedCount }: { completedCount: number }) {
  const { execute, isPending } = useAction(deleteCompletedTodosAction, {
    onSuccess: ({ data }) => {
      toast.success(`Deleted ${data?.count ?? completedCount} completed task${completedCount === 1 ? "" : "s"}`);
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Failed to delete completed tasks");
    },
  });

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={completedCount === 0 || isPending}
      onClick={() => execute()}
      className="self-start"
    >
      <Trash2Icon data-icon="inline-start" />
      {isPending ? "Deleting..." : "Delete completed"}
    </Button>
  );
}
