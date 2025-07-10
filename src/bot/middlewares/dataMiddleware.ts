import { isUserProfileComplete } from "../../utils/checkUserProfile";
import { Middleware } from "grammy";
import { CustomContext } from "../../types";
import { getUser } from "../../utils/getUser";

/**
 * Middleware для проверки наличия пользователя и всех обязательных данных.
 * Если что-то отсутствует — отклоняет доступ.
 */
export const dataMiddleware: Middleware<CustomContext> = async (ctx, next) => {
    const user = await getUser(ctx);

    if (!user) return;

    // Проверяем обязательные поля
    if (!isUserProfileComplete(user)) {
        await ctx.api.sendMessage(ctx.chat!.id, "Пожалуйста, заполните все обязательные поля в профиле. Используйте команду /start для начала");
        return;
    }

    await next();
};
