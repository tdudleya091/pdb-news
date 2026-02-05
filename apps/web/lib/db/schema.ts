import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { BriefSection, WeatherData, NewsItem } from "../types";

export const briefs = sqliteTable("briefs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: integer("date", { mode: "timestamp" }).notNull(),
  weather: text("weather", { mode: "json" }).notNull().$type<WeatherData>(),
  executiveSummary: text("executive_summary").notNull(),
  sections: text("sections", { mode: "json" }).notNull().$type<BriefSection[]>(),
  rawNews: text("raw_news", { mode: "json" }).$type<NewsItem[]>(),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  deliveredVia: text("delivered_via", { mode: "json" }).$type<string[]>().default([]),
});

export const deliveryLogs = sqliteTable("delivery_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  briefId: text("brief_id").references(() => briefs.id),
  channel: text("channel").notNull(),
  status: text("status").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  error: text("error"),
});

export type Brief = typeof briefs.$inferSelect;
export type NewBrief = typeof briefs.$inferInsert;
export type DeliveryLog = typeof deliveryLogs.$inferSelect;
