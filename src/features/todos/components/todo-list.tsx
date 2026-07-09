import { getTodos } from "../data";
import { DeleteCompletedButton } from "./delete-completed-button";
import { TodoItem } from "./todo-item";

export async function TodoList({ userId }: { userId: string }) {
  const items = await getTodos(userId);
  const completedCount = items.filter((todo) => todo.completed).length;

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No todos yet. Add one above.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {completedCount > 0 && <DeleteCompletedButton completedCount={completedCount} />}
      <ul className="space-y-2">
        {items.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    </div>
  );
}
