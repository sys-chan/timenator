import { Middleware } from "grammy";
import { CustomContext } from "../../types";
import { getUser } from "../../utils/getUser";

export const adminMiddleware: Middleware<CustomContext> = async (ctx, next) => {
    const user = await getUser(ctx);

    if (!user) return;
    if (!user.isAdmin) return;

    await next();
};
