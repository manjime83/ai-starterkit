import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoForm } from "@/features/todos/components/todo-form";
import { TodoList } from "@/features/todos/components/todo-list";
import { getTodos } from "@/features/todos/data";
import { verifySession } from "@/lib/auth";

// Demo feature — delete when done (STACK.md Step 26).
export default async function TodosPage() {
  const session = await verifySession();
  const todos = await getTodos(session.user.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a todo</CardTitle>
          <CardDescription>Optionally attach a JPEG, PNG, or PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <TodoForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your todos</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList todos={todos} />
        </CardContent>
      </Card>
    </div>
  );
}
