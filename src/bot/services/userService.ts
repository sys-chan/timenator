import { NewUser, User, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Credentials, UserParams } from "../../types";
import { decryptTokens, encryptTokens } from "../../utils/encryption";

/**
 * Функция для поиска пользователя в базе данных по Telegram ID.
 * Если пользователь не найден, создаёт нового пользователя.
 *
 * @param {NodePgDatabase} db - Экземпляр базы данных
 * @param {number} telegramId - Telegram ID пользователя
 * @returns {Promise<User | undefined>} Объект пользователя или нового пользователя, undefined при ошибке
 */
export async function findUser(db: NodePgDatabase, telegramId: number): Promise<User | undefined> {
    try {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.telegramId, BigInt(telegramId)))
            .limit(1);
        
        // Если пользователь найден, возвращаем его
        if (user.length > 0) {
            return user[0];
        }

        // Если пользователь не найден, создаём нового
        const newUserData = {
            telegramId: BigInt(telegramId), // Telegram ID пользователя
            params: { persona: "timenator" },
        };

        const newUser = await db
            .insert(users)
            .values(newUserData as NewUser)
            .returning();
        
        return newUser[0] || user;
    } catch (e) {
        console.error("Ошибка при поиске или создании пользователя: ", e);
    }
}

/**
 * Функция для обновления токенов пользователя в базе данных.
 *
 * @param {NodePgDatabase} db - Экземпляр базы данных
 * @param {number} telegramId - Telegram ID пользователя
 * @param {"google" | "yandex"} tokensFrom - Источник токенов ("google" или "yandex")
 * @param {Credentials} tokens - Токены для обновления
 * @returns {Promise<User | undefined>} Объект пользователя или нового пользователя, undefined при ошибке
 */
export async function setUserTokens(db: NodePgDatabase, telegramId: number, tokensFrom: "google" | "yandex", tokens: Credentials): Promise<User | undefined> {
    try {
        const updateData: Partial<NewUser> = {
            updatedAt: new Date(),
        };

        if (tokensFrom === "google") {
            updateData.googleCalendarTokens = encryptTokens(tokens);
            updateData.selectedCalendar = tokensFrom;
        }

        const user = await findUser(db, telegramId);
        const updatedUser = await db
            .update(users)
            .set(updateData)
            .where(eq(users.telegramId, BigInt(telegramId)))
            .returning();

        return updatedUser[0] || user;
    } catch (e) {
        console.error("Ошибка при обновлении токена пользователя: ", e);
    }
}

/**
 * Функция для получения и дешифрования токенов пользователя из базы данных.
 * 
 * @param {User} user - Объект пользователя
 * @returns {Credentials} - Учетные данные для доступа к Google API.
 */
export async function getUserTokens(user: User): Promise<Credentials | undefined> {
    return decryptTokens(user?.googleCalendarTokens!);
}

/**
 * Функция для обновления параметров пользователя.
 *
 * @param {NodePgDatabase} db - Экземпляр базы данных
 * @param {number} telegramId - Telegram ID пользователя
 * @param {UserParams} params - Параметры для обновления
 * @returns {Promise<User | undefined>} Объект пользователя или нового пользователя, undefined при ошибке
 */
export async function setUserSetupData(db: NodePgDatabase, telegramId: number, params: UserParams): Promise<User | undefined> {
    try {
        const user = await findUser(db, telegramId);

        // Если пользователь не найден, можно вернуть undefined или обработать иначе
        if (!user) {
            return undefined;
        }

        const updateData: Partial<NewUser> = {
            updatedAt: new Date(),
        };

        // Объединяем существующие параметры с новыми
        updateData.params = {
            ...user.params, // Существующие параметры
            ...params,      // Новые параметры, перезаписывающие только указанные поля
        };

        // Проверяем, есть ли что обновлять
        if (Object.keys(updateData).length === 1 && !updateData.params) {
            return user;
        }

        const updatedUser = await db
            .update(users)
            .set(updateData)
            .where(eq(users.telegramId, BigInt(telegramId)))
            .returning();

        return updatedUser[0] || user;
    } catch (e) {
        console.error("Ошибка при обновлении параметров пользователя: ", e);
        return undefined;
    }
}

export async function setUserPremium(db: NodePgDatabase, telegramId: number, hasPremium: boolean = true) {
    try {
        const user = await findUser(db, telegramId);

        const updateData: Partial<NewUser> = {
            hasPremium,
        }

        const updatedUser = await db
            .update(users)
            .set(updateData)
            .where(eq(users.telegramId, BigInt(telegramId)))
            .returning();
        
        return updatedUser[0] || user;
    } catch (e) {
        console.error("Ошибка при обновлении параметров пользователя: ", e)
    }
}

export async function getUsersReportsTimes(db: NodePgDatabase) {
    const usersList = await db
        .select()
        .from(users);

    const filteredUsers = usersList
        .filter(u => u.params?.morningReportTime != null && u.params?.eveningReportTime != null)
        .map(u => ({
            telegramId: Number(u.telegramId),
            morningReportTime: u.params!.morningReportTime,
            eveningReportTime: u.params!.eveningReportTime
        }));

    return filteredUsers;
}

export async function getUserReportsTimes(user: User) {
    return {morningReportTime: user?.params?.morningReportTime, eveningReportTime: user?.params?.eveningReportTime};
}