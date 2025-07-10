import { User } from "../db/schema";
import { findUser } from "../bot/services/userService";
import { CustomContext } from "../types";

/**
 * Получает пользователя по telegramId из ctx.
 * @param {CustomContext} ctx - Контекст
 * @returns {Promise<User | undefined>} Объект пользователя или undefined
 */
export async function getUser(ctx: CustomContext): Promise<User | undefined> {

    const telegramId = ctx.from?.id;

    if (!telegramId) return;

    const user = await findUser(ctx.db, telegramId);

    if (!user) {
        console.error(`Не удалось найти или создать пользователя для Telegram ID: ${telegramId}`);
        return;
    }

    return user;
}
