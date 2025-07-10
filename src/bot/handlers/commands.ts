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
        // .url("Yandex Календарь", `https://api.greenlr.site/timenator/auth/yandex?tgId=${ctx.from?.id}`);

    await ctx.reply("*Добро пожаловать\\!*\nВыберите календарь для подключения, чтобы начать\n\n_Что\\-то не работает? Напишите @greenlr_", {reply_markup: replyKb, parse_mode: "MarkdownV2"});
});

commands.command("getGoogleCalendarEvents", async (ctx) => {
    const user = await getUser(ctx);

    const result = await getGoogleCalendarEvents(ctx.db, ctx.from?.id!, (await getUserTokens(user!))!);

    if (!result) return;

    await ctx.reply(result.map(event => `${event.start?.dateTime}/${event.end?.dateTime} – ${event.summary}`).join('\n'));
});

commands.command("getGoogleCalendarTasks", async (ctx) => {
    const user = await getUser(ctx);
    const result = await getGoogleCalendarTasks(ctx.db, ctx.from?.id!, (await getUserTokens(user!))!);
    if (!result) return;
    await ctx.reply(result.map(task => `${task.title} – ${task.status === "completed" ? "Выполнена" : "Не выполнена"}`).join('\n'));
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

commands.command("info", async (ctx) => {
    await getUsersReportsTimes(ctx.db);
})

export default commands;