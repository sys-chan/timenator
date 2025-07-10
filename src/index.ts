import { getUsersReportsTimes } from "./bot/services";
import bot from "./bot";
import server from "./server";
import { startReportScheduler } from "./utils/sheduler";
import db from "./db";
import "dotenv/config";

bot.start();
console.log("Бот запущен");
bot.catch((e) => console.error(e));

async function startSheduler() {
    startReportScheduler(await getUsersReportsTimes(db));
}

startSheduler();

server.listen(process.env.PORT, () => {
  console.log(`Сервер аутентификации запущен на порту ${process.env.PORT}`);
});