import { getGoogleAuthUrl, getGoogleTokens } from "../utils/googleAuth";
import express from "express";
import path from "path";
import bot from "../bot";
import { InlineKeyboard } from "grammy";
import { setUserTokens } from "../bot/services";
import db from "../db";

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/timenator/auth/google", (req, res) => {
  (async () => {
    const telegramId = req.query.tgId as string;
    if (!telegramId) return res.status(400).send("Не указан Telegram ID");
    const url = getGoogleAuthUrl(telegramId);
    res.redirect(url);
  })();
});

app.get("/timenator/auth/google/callback", (req, res) => {
  (async () => {
    const code = req.query.code as string;
    const telegramId = req.query.state as string;
    if (!code) return res.status(400).send("Код не указан");
    try {
      const tokens = await getGoogleTokens(code);
      if (telegramId && tokens) {
        setUserTokens(db, Number(telegramId), "google", tokens)
        const inlineKb = new InlineKeyboard()
          .text("Продолжить", "setup")
        bot.api.sendMessage(Number(telegramId), "Google Календарь успешно подключен!", {reply_markup: inlineKb});
        res.send("Google Календарь успешно подключен!");
      }
    } catch (e) {
      res.status(500).send("Ошибка при получении токена: " + e);
    }
  })();
});

// app.get("/timenator/auth/yandex", (req, res) => {
//   (async () => {
//     const telegramId = req.query.tgId as string; 
//     if (!telegramId) return res.status(400).send("Не указан Telegram ID");
//     const url = getYandexAuthUrl(telegramId);
//     res.redirect(url);
//   })();
// });

// app.get("/timenator/auth/yandex/callback", (req, res) => {
//   (async () => {
//     const code = req.query.code as string;
//     const telegramId = req.query.state as string;
//     if (!code) return res.status(400).send("Код не указан");
//     try {
//       const tokens = await getYandexTokens(code);
//       if (telegramId && tokens) {
//         setUserTokens(db, Number(telegramId), "yandex", tokens);
//         const inlineKb = new InlineKeyboard()
//           .text("Продолжить", "setup")
//         bot.api.sendMessage(Number(telegramId), "Yandex Календарь успешно подключен!", {reply_markup: inlineKb});
//         res.send("Yandex Календарь успешно подключен!");
//       }
//     } catch (e) {
//       res.status(500).send("Ошибка при получении токена: " + e);
//     }
//   })();
// });

export default app;