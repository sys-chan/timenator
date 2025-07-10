import { pgTable, serial, bigint, varchar, boolean, timestamp, text, index, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { UserParams } from "../types";

export const users = pgTable("users", {

    // Идентификаторы
    id: serial("id").primaryKey(), // Внутренний ID пользователя (автоинкремент)
    telegramId: bigint("telegram_id", { mode: "bigint" }).unique().notNull(), // Telegram ID пользователя, уникальный

    // Параметры пользователя
    params: jsonb("user_params").$type<UserParams>(),

    // Права доступа
    isAdmin: boolean("is_admin").default(false), // Доступ к администрированию
    hasPremium: boolean("has_premium").default(false), // Доступ к платному функционалу

    // Календари
    selectedCalendar: varchar("selected_calendar", { length: 50 }), // Выбранный календарь (например, "google", "yandex")
    googleCalendarTokens: text("google_calendar_tokens"), // Токены для Google Calendar API

    // Информация о записи
    createdAt: timestamp("created_at").defaultNow().notNull(), // Время создания записи
    updatedAt: timestamp("updated_at").defaultNow().notNull() // Время последнего обновления
    
}, (table) => [
    index("telegram_id_idx").on(table.telegramId), // Бинарное древо для быстрого поиска по telegramId
]);

// Определение отношений
export const usersRelations = relations(users, ({ }) => ({}));

// Тип для TypeScript (для использования в коде)
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;