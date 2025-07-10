import { Menu } from "@grammyjs/menu";
import { setUserSetupData } from "../../bot/services/userService";
import { Composer } from "grammy";
import { CustomContext } from "../../types";
import { premiumMiddleware } from "../../bot/middlewares/premiumMiddleware";

const menus = new Composer<CustomContext>();

const personaRootMenu = new Menu<CustomContext>("persona:root")
    .submenu("Timenator", "persona:timenator", (ctx) => ctx.editMessageText("*Timenator*\n\nБазовый ИИ\\-ассистент, вежливый и приветливый", {parse_mode: "MarkdownV2"})).row()
    .submenu("Animenator", "persona:animenator", (ctx) => ctx.editMessageText("*Animenator*\n\nМилая аниме\\-девочка и приятный собеседник, поможет не заскучать при выполнении задач\n\n_Доступен с Timenator Premium_", {parse_mode: "MarkdownV2"})).row()
    .submenu("Motivator", "persona:motivator", (ctx) => ctx.editMessageText("*Motivator*\n\nМотиватор и фитнес\\-тренер, заставит выполнить все задачи до долбанного отказа\n\n_Доступен с Timenator Premium_", {parse_mode: "MarkdownV2"}) )


const personaTimenatorMenu = new Menu<CustomContext>("persona:timenator")
    .text("Выбрать", (ctx) => {ctx.reply("Выбран Timenator!"); setUserSetupData(ctx.db, ctx.from.id!, {persona: "timenator"})}).row()
    .back("Назад", (ctx) => ctx.editMessageText("Выберите пресет для ИИ-ассистента:"));


const personaAnimenatorMenu = new Menu<CustomContext>("persona:animenator")
    .text("Выбрать", (ctx) => {ctx.reply("Выбран Animenator!"); setUserSetupData(ctx.db, ctx.from.id!, {persona: "animenator"})}).row()
    .back("Назад", (ctx) => ctx.editMessageText("Выберите пресет для ИИ-ассистента:"));


const personaMotivatorMenu = new Menu<CustomContext>("persona:motivator")
    .text("Выбрать", (ctx) => {ctx.reply("Выбран Motivator!"); setUserSetupData(ctx.db, ctx.from.id!, {persona: "motivator"})}).row()
    .back("Назад", (ctx) => ctx.editMessageText("Выберите пресет для ИИ-ассистента:"));


menus.use(personaRootMenu);
personaRootMenu.register(personaTimenatorMenu);
personaRootMenu.register(personaAnimenatorMenu);
personaRootMenu.register(personaMotivatorMenu);

menus.command("persona", premiumMiddleware, async (ctx) => {
    await ctx.reply("Выберите пресет для ИИ-ассистента:", {reply_markup: personaRootMenu});
})

export default menus;