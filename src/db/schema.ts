import {
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  serial,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 32 }).notNull(),
  xp: integer("xp").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const levelProgress = pgTable(
  "level_progress",
  {
    id: serial("id").primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    stars: integer("stars").notNull().default(0),
    bestScore: integer("best_score").notNull().default(0),
    bestAccuracy: integer("best_accuracy").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("level_progress_player_level").on(t.playerId, t.level)],
);
