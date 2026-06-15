import { getTodos } from "../data";
import { TodoItem } from "./todo-item";

export async function TodoList({ userId }: { userId: string }) {
  const items = await getTodos(userId);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No todos yet. Add one above.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
