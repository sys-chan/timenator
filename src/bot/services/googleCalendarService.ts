import { calendar_v3 } from "@googleapis/calendar";
import { Credentials } from "types";
import { google, tasks_v1 } from "googleapis";
import "dotenv/config";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { setUserTokens } from "./userService";

/**
 * Функция для получения событий из Google Календаря, обновляет токены пользователя при каждом запросе.
 * 
 * @param {NodePgDatabase} db - Объект базы данных.
 * @param {number} telegramId = Telegram ID пользователя.
 * @param {Credentials} credentials - Учетные данные для доступа к Google API.
 * @param {string} calendarId - Идентификатор календаря (по умолчанию "primary").
 * @param {string} timeMin - Минимальное время начала событий в формате ISO (по умолчанию начало текущего дня).
 * @param {string} timeMax - Максимальное время окончания событий в формате ISO (по умолчанию начало следующего дня).
 * @param {number} maxResults - Максимальное количество результатов (по умолчанию 48).
 * @returns {calendar_v3.Schema$Event[]} - Список событий или undefined в случае ошибки.
 */
export async function getGoogleCalendarEvents(
    db: NodePgDatabase,
    telegramId: number,
    credentials: Credentials, 
    calendarId: string = "primary", 
    timeMin: string = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    timeMax: string = new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setUTCHours(0, 0, 0, 0)).toISOString(),
    maxResults: number = 48,
): Promise<calendar_v3.Schema$Event[] | undefined> {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );

    // Используем токены из БД 
    auth.setCredentials(credentials);

    // Обновляем токены
    const { credentials: newCredentials } = await auth.refreshAccessToken();

    // Сохраняем в БД новые токены и используем их
    await setUserTokens(db, telegramId, "google", newCredentials);
    auth.setCredentials(newCredentials);

    // А тут запросы к календарю
    const calendar = google.calendar({ version: "v3", auth });

    try {
        const params: calendar_v3.Params$Resource$Events$List = {
            calendarId,
            timeMin,
            timeMax,
            maxResults,
            singleEvents: true,
            orderBy: "startTime",
        };
        const response = await calendar.events.list(params);
        const eventsList = response.data.items;

        if (!eventsList || eventsList.length === 0) {
            console.log("События не найдены.");
            return;
        }

        console.log("События: ");
        eventsList.forEach((e) => {
            const start = e.start?.dateTime || e.start?.date;
            console.log(`${start} - ${e.summary}`);
        });

        return eventsList;
    } catch (e) {
        console.error("Ошибка при получении событий: ", e);
    }
}


/**
 * Функция для получения задач из Google Задач, обновляет токены пользователя при каждом запросе.
 *
 * @param {NodePgDatabase} db - Объект базы данных.
 * @param {number} telegramId - Telegram ID пользователя.
 * @param {Credentials} credentials - Учетные данные для доступа к Google API.
 * @param {string} dueMin - Минимальное время начала задач в формате ISO (по умолчанию начало текущего дня).
 * @param {string} dueMax - Максимальное время окончания задач в формате ISO (по умолчанию конец текущего дня).
 * @param {number} maxResults - Максимальное количество результатов (по умолчанию 48).
 * @returns {tasks_v1.Schema$Task[]} Список задач или undefined в случае ошибки.
 */
export async function getGoogleCalendarTasks(
    db: NodePgDatabase,
    telegramId: number, 
    credentials: Credentials,
    dueMin: string = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString(),
    dueMax: string = new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setUTCHours(0, 0, 0, 0)).toISOString(),
    maxResults: number = 48,
): Promise<tasks_v1.Schema$Task[] | undefined> {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );

    // Используем токены из БД 
    auth.setCredentials(credentials);

    // Обновляем токены
    const { credentials: newCredentials } = await auth.refreshAccessToken();

    // Сохраняем в БД новые токены и используем их
    await setUserTokens(db, telegramId, "google", newCredentials);
    auth.setCredentials(newCredentials);


    const tasks = google.tasks({ version: "v1", auth });

    try {
        const tasksLists = await tasks.tasklists.list();

        const tasklist = tasksLists.data.items![0].id!;

        const params: tasks_v1.Params$Resource$Tasks$List = {
            tasklist,
            dueMin,
            dueMax,
            maxResults,
            showHidden: true,
            showCompleted: true,
        }

        const response = await tasks.tasks.list(params);
        let tasksList = response.data.items;

        if (!tasksList || tasksList.length === 0) {
            console.log("Задачи не найдены.");
            return;
        }

        console.log("Задачи: ");
        tasksList.forEach((task) => {
            console.log(task.title)
        });

        return tasksList;
    } catch (e) {
        console.error("Ошибка при получении задач: ", e);
        return undefined;
    }
}

/**
 * Retrieves the current time and time of day based on the user's Google Calendar timezone.
 *
 * @param {NodePgDatabase} db - Database object.
 * @param {number} telegramId - User's Telegram ID.
 * @param {Credentials} credentials - Credentials for accessing Google API.
 * @param {string} calendarId - Calendar identifier (default: "primary").
 * @returns {Promise<{ isoTime: string, timeOfDay: "morning" | "day" | "evening" } | undefined>} - Current time in ISO format and time of day, or undefined if an error occurs.
 */
export async function getGoogleCalendarTime(
    db: NodePgDatabase,
    telegramId: number,
    credentials: Credentials,
    calendarId: string = "primary"
): Promise<
    { isoTime: string; timeOfDay: "morning" | "day" | "evening" } | undefined
> {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from database
    auth.setCredentials(credentials);

    try {
        // Refresh tokens
        const { credentials: newCredentials } = await auth.refreshAccessToken();

        // Save new tokens to database and use them
        await setUserTokens(db, telegramId, "google", newCredentials);
        auth.setCredentials(newCredentials);

        const calendar = google.calendar({ version: "v3", auth });

        // Get calendar details to retrieve timezone
        const calendarResponse = await calendar.calendars.get({ calendarId });
        const timezone = calendarResponse.data.timeZone;

        if (!timezone) {
            console.error("Timezone not found for calendar:", calendarId);
            return undefined;
        }

        // Get current time in the calendar's timezone
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            hour12: false,
        });
        const hours = parseInt(formatter.format(now));

        // Determine time of day
        let timeOfDay: "morning" | "day" | "evening";
        if (hours >= 5 && hours < 12) {
            timeOfDay = "morning";
        } else if (hours >= 12 && hours < 17) {
            timeOfDay = "day";
        } else {
            timeOfDay = "evening";
        }

        // Format current time as ISO string in the user's timezone
        const isoTime = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        })
            .format(now)
            .replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$1-$2T$4:$5:$6.000Z");

        console.log(`Current time in ${timezone}: ${hours} (${timeOfDay})`);

        return { isoTime, timeOfDay };
    } catch (e) {
        console.error("Error retrieving calendar time:", e);
        return undefined;
    }
}