import { TodoForm } from "@/features/todos/ui/todo-form";
import { TodoList } from "@/features/todos/ui/todo-list";
import { verifySession } from "@/lib/auth";

export default async function TodosPage() {
  const session = await verifySession();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Todos</h1>
      <TodoForm />
      <TodoList userId={session.user.id} />
    </div>
  );
}
