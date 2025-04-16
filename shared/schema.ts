import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  shareId: text("share_id").notNull().unique(),
  data: json("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  description: text("description"),
  userId: integer("user_id"),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  shareId: true,
  data: true,
  description: true,
  userId: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
