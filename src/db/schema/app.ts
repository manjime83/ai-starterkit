import { createId } from "@paralleldrive/cuid2";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const todos = pgTable("todos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  attachmentKey: text("attachment_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  polarSubscriptionId: text("polar_subscription_id").notNull().unique(),
  status: text("status").notNull(),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
