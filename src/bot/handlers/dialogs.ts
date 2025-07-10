import { UserParams } from "../../types";
import { Conversation, ConversationFlavor, conversations, createConversation } from "@grammyjs/conversations";
import { findUser, setUserSetupData } from "../services/userService";
import { Composer, Context, InlineKeyboard } from "grammy";
import db from "../../db";
import { scheduleUserReports } from "../../utils/sheduler";

const confirmKb = new InlineKeyboard()
    .text("ОК", "true")
    .row()
    .text("Отмена", "false");

const genderKb = new InlineKeyboard()
    .text("Мужской", "gender:male")
    .row()
    .text("Женский", "gender:female");

const addressingKb = new InlineKeyboard()
    .text("Формальная (на Вы)", "addressing:formal")
    .row()
    .text("Неформальная (на Ты)", "addressing:informal");

const dialog = new Composer<ConversationFlavor<Context>>();

dialog.use(conversations());

dialog.callbackQuery("cancel", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.exitAll();
});

dialog.command("cancel", async (ctx) => {
    await ctx.conversation.exitAll();
});

async function setupConversation(conversation: Conversation, ctx: Context) {
    const user = await findUser(db, ctx.from?.id!);
    let data: UserParams = {
        persona: user?.params?.persona || "timenator",
    };

    // Имя
    const nameCheckpoint = conversation.checkpoint();
    await ctx.reply("Введите своё имя\n\n_\\(строка, например, Иван\\)_", {
        parse_mode: "MarkdownV2",
    });
    data.name = await conversation.form.text();
    await ctx.reply(`Бот будет обращаться к вам по имени «${data.name}»`, {
        reply_markup: confirmKb
    });
    const nameConfirmCtx = await conversation.waitForCallbackQuery(/(true|false)/);
    await nameConfirmCtx.answerCallbackQuery();
    if (nameConfirmCtx.callbackQuery.data === "false") {
        await conversation.rewind(nameCheckpoint);
    }

    // Пол
    await ctx.reply("Выберите свой пол", {
        reply_markup: genderKb
    });
    const genderCtx = await conversation.waitForCallbackQuery(/gender:(male|female)/);
    await genderCtx.answerCallbackQuery();
    data.gender = genderCtx.callbackQuery.data.split(":")[1] as "male" | "female";

    // Форма обращения
    await ctx.reply("Выберите форму общения", {
        reply_markup: addressingKb
    });
    const addressingCtx = await conversation.waitForCallbackQuery(/addressing:\w+/);
    await addressingCtx.answerCallbackQuery();
    data.addressing = addressingCtx.callbackQuery.data.split(':')[1] || undefined;

    // Настройка времени отчётов
    const reportTimeCheckpoint = conversation.checkpoint();

    // Утренний отчёт
    await ctx.reply("Введите время для утреннего отчёта в UTC\n\n_\\(строка в формате hh:mm, например, 03:30 – МСК 08:30\\)_", {
        parse_mode: "MarkdownV2",
    });
    const morningReportTimeCheckpoint = conversation.checkpoint();
    const inputMorningReportTime = (await conversation.form.text()).trim();
    if (!checkTime(inputMorningReportTime)) {
        await ctx.reply("Неверный формат времени\\. Пожалуйста, введите время в формате hh:mm\n\n_\\(например, 03:30\\)_", {
            parse_mode: "MarkdownV2",
        });
        await conversation.rewind(morningReportTimeCheckpoint);
    }
    data.morningReportTime = inputMorningReportTime;

    // Вечерний отчёт
    await ctx.reply("Введите время для вечернего отчёта в UTC\n\n_\\(строка в формате hh:mm, например, 13:30 – МСК 18:30\\)_", {
        parse_mode: "MarkdownV2",
    });
    const eveningReportTimeCheckpoint = conversation.checkpoint();
    const inputEveningReportTime = (await conversation.form.text());
    if (!checkTime(inputEveningReportTime)) {
        await ctx.reply("Неверный формат времени\\. Пожалуйста, введите время в формате hh:mm\n\n_\\(например, 13:30\\)_", {
            parse_mode: "MarkdownV2",
        });
        await conversation.rewind(eveningReportTimeCheckpoint);
    }
    data.eveningReportTime = inputEveningReportTime;

    await ctx.reply(`🌅 Утренний отчёт придёт в ${data.morningReportTime}\n\n🌇 Вечерний отчёт придёт в ${data.eveningReportTime}\n\n_\\(время указано для часового пояса UTC\\)_`, {
        reply_markup: confirmKb,
        parse_mode: "MarkdownV2",
    });
    const timeConfirmCtx = await conversation.waitForCallbackQuery(/(true|false)/);
    await timeConfirmCtx.answerCallbackQuery();
    if (timeConfirmCtx.callbackQuery.data === "false") {
        await conversation.rewind(reportTimeCheckpoint);
    }

    scheduleUserReports(ctx.from?.id!, inputMorningReportTime, inputEveningReportTime);

    await ctx.reply("Настройки сохранены, их можно посмотреть в /settings");
    console.log(await setUserSetupData(db, ctx.from?.id!, data));
}
dialog.use(createConversation(setupConversation));

dialog.callbackQuery("setup", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("setupConversation");
});

dialog.command("setup", async (ctx) => {
    await ctx.conversation.enter("setupConversation");
});

function checkTime(inputTime: string) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(inputTime);
}

export default dialog;