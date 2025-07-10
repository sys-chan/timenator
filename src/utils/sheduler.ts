import { sendReport } from "../bot/services/geminiAiService";
import cron, { ScheduledTask } from "node-cron";

interface UserTasks {
    morningTask: ScheduledTask | null,
    eveningTask: ScheduledTask | null,
}

const taskStore: Map<number, UserTasks> = new Map();


function timeToCron(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return `0 ${minutes} ${hours} * * *`;
}


export function scheduleUserReports(telegramId: number, morningReportTime: string, eveningReportTime: string): void {

  const existingTasks = taskStore.get(telegramId);
  if (existingTasks) {
    existingTasks.morningTask?.stop();
    existingTasks.eveningTask?.stop();
  }

  const morningCron = timeToCron(morningReportTime);
  const morningTask = cron.schedule(morningCron, () => {
    sendReport(telegramId, "morning");
  });

  const eveningCron = timeToCron(eveningReportTime);
  const eveningTask = cron.schedule(eveningCron, () => {
    sendReport(telegramId, "evening");
  });

  taskStore.set(telegramId, {morningTask, eveningTask});

  console.log(`Запланированы отчёты для ${telegramId}: утренний в ${morningReportTime}, вечерний в ${eveningReportTime}`);
}


export function startReportScheduler(users: {telegramId: number, morningReportTime?: string, eveningReportTime?: string}[]): void {
  users.forEach(u => scheduleUserReports(u.telegramId, u.morningReportTime!, u.eveningReportTime!));
  console.log("Постановщик задач запущен");
}