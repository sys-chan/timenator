import { CustomContext } from "../../types";
import { findUser, setUserPremium } from "../../bot/services";
import { Composer } from "grammy";

const callbacks = new Composer<CustomContext>();

callbacks.callbackQuery("yandex", async (ctx) => {
    ctx.answerCallbackQuery({
        text: "К сожалению, Yandex Календарь подключить не получится – мы ожидаем, пока Yandex разработают удобный API",
        show_alert: true,
    });
})

callbacks.callbackQuery("buy", async (ctx) => {
    await ctx.answerCallbackQuery();
    const user = await findUser(ctx.db, ctx.from?.id!);
    
    if (!(user?.hasPremium)) {
        
        try {
            await ctx.replyWithInvoice(   
                "Timenator Premium",
                "Получите доступ к /premium функциям",
                `purchase_${ctx.from?.id}_${new Date().toUTCString()}`,
                "XTR",
                [
                    {
                        amount: 5,
                        label: "Timenator Premium",
                    },
                ],
            );
        } catch (e) {
                console.error("Ошибка при отправке счета:", e);
                await ctx.reply("Произошла ошибка при создании счета. Попробуйте позже");
        }
    } else {
        await ctx.reply("У вас уже есть *Timenator Premium*\n\n_Если вы хотите поддержать разработчика – отправьте звёзды @greenlr_", {
            parse_mode: "MarkdownV2",
        });
    }
});

callbacks.on("pre_checkout_query", async (ctx) => {
    try {
        await ctx.answerPreCheckoutQuery(true);
    } catch (error) {
        console.error("Ошибка при обработке pre_checkout_query:", error);
        await ctx.answerPreCheckoutQuery(false, {
            error_message: "Ошибка при подтверждении платежа",
        });
    }
});

callbacks.on("msg:successful_payment", async (ctx) => {
    const payment = ctx.message?.successful_payment;
    if (payment) {
        await ctx.reply("*Спасибо за покупкy\\!*\nТеперь вы можете использовать /premium функции", {
            parse_mode: "MarkdownV2",
        });
        await setUserPremium(ctx.db, ctx.from?.id!);
    }
});

export default callbacks;