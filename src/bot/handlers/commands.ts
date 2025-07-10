import { getGoogleCalendarEvents, getGoogleCalendarTasks } from "../services/googleCalendarService";
import { CustomContext } from "../../types";
import { Composer, InlineKeyboard } from "grammy";
import { findUser, getUsersReportsTimes, getUserTokens } from "../services";
import { getUser } from "../../utils/getUser";

const commands = new Composer<CustomContext>();

commands.command("start", async (ctx) => {
    const replyKb = new InlineKeyboard()
        .url("Google Календарь", `https://api.greenlr.site/timenator/auth/google?tgId=${ctx.from?.id}`)
        .text("Yandex Календарь", "yandex");

    await ctx.reply("*Добро пожаловать\\!*\nВыберите календарь для подключения, чтобы начать\n\n_Что\\-то не работает? Напишите @greenlr_", {reply_markup: replyKb, parse_mode: "MarkdownV2"});
});

commands.command("premium", async (ctx) => {
    const user = await getUser(ctx);
    const replyKb = new InlineKeyboard()
        .text("Купить", "buy");
    ctx.reply("*Timenator Premium*\n\n• ∞ сообщения _~3 сообщения в день~_\n• 3 пресета для ИИ _~1 пресет для ИИ~_", {
        reply_markup: !(user?.hasPremium) ? replyKb : undefined,
        parse_mode: "MarkdownV2"
    })
});

export default commands;