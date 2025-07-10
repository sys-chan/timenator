import { Bot } from "grammy";
import "dotenv/config";
import { CustomContext } from "../types";
import handlers from "./handlers";
import { ConversationFlavor } from "@grammyjs/conversations";
import middlewares from "./middlewares";

const bot = new Bot<ConversationFlavor<CustomContext>>(process.env.BOT_TOKEN);

middlewares.forEach(middleware => bot.use(middleware));
handlers.forEach(handler => bot.use(handler));

export default bot;