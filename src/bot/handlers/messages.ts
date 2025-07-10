import { CustomContext } from "../../types";
import { Composer } from "grammy";
import { dataMiddleware } from "../middlewares/dataMiddleware";
import { getMotivationByRequest } from "../../bot/services";
import { getUser } from "../../utils/getUser";
import { marked } from "marked";
import { randomResponse } from "../../utils/randomResponse";

const messages = new Composer<CustomContext>();

messages.on(":text", dataMiddleware, async (ctx) => {
    const user = await getUser(ctx);

    if (!user?.hasPremium) {
        const messageKey = `user:${ctx.from?.id}:messages`; 
        const messageCount = await ctx.redis.get(messageKey);
        const currentCount = messageCount ? parseInt(messageCount, 10) : 0;

        if (currentCount >= 3) {
            await ctx.reply(
                "Вы превысили лимит в 3 сообщения в день. Оформите /premium для снятия ограничений или напишите @greenlr"
            );
            return;
        }

        await ctx.redis.incr(messageKey);
        if (currentCount === 0) {
            await ctx.redis.expire(messageKey, 86400);
        }        
    }

    const response = await getMotivationByRequest(ctx);

    await ctx.reply(response ? await marked.parseInline(response) : randomResponse(), {parse_mode: "HTML"});
})

export default messages;