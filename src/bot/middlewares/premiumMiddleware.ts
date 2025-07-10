import { Middleware } from "grammy";
import { CustomContext } from "../../types";
import { getUser } from "../../utils/getUser";

export const premiumMiddleware: Middleware<CustomContext> = async (ctx, next) => {
    const user = await getUser(ctx);

    if (!user) {
        await ctx.reply("Купите /premium, чтобы получить доступ к этой функции");
        return;
    };
    if (!user.hasPremium) await next();

    await next();
};
