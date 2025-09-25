import { sqliteTable, text, integer, primaryKey, unique } from "drizzle-orm/sqlite-core";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { AdapterAccountType } from "next-auth/adapters";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const dbPath = process.env.DB_URI || path.join(process.cwd(), 'database', 'crewnow.db');
console.log("Database path:", dbPath);

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbExists = fs.existsSync(dbPath);

if (!dbExists) {
  fs.writeFileSync(dbPath, "");
  console.log("Database created, running migrations...");
  const tempSqlite = new Database(dbPath, { readonly: false, fileMustExist: false });
  const tempDb = drizzle({ client: tempSqlite, logger: true });
  migrate(tempDb, { migrationsFolder: './drizzle' });
  tempSqlite.close();
  console.log("Migrations completed");
}

const sqlite = new Database(dbPath, { readonly: false, fileMustExist: false });
export const db = drizzle({ client: sqlite, logger: true });

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  creationDate: integer("creation_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  streakLength: integer("streak_length").notNull().default(0),
})

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
)

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
})

export const posts = sqliteTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  frontImageUrl: text("front_image_url"),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  creationDate: integer("creation_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const moment = sqliteTable("moment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
})

export const comments = sqliteTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  creationDate: integer("creation_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const userReactions = sqliteTable(
  "user_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    creationDate: integer("creation_date", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    emoji: text("emoji").notNull(),
  },
  (userReactions) => [
    unique().on(userReactions.userId, userReactions.emoji),
  ]
)

export const reactions = sqliteTable("reactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  reactionId: text("reaction_id")
    .notNull()
    .references(() => userReactions.id, { onDelete: "cascade" }),
  creationDate: integer("creation_date", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Moment = typeof moment.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type UserReaction = typeof userReactions.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;