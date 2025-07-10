import { User } from "../db/schema";

/**
 * Проверяет, заполнены ли все обязательные поля пользователя и есть ли хотя бы один токен.
 * @param user - объект пользователя
 * @returns true, если профиль заполнен, иначе false
 */
export function isUserProfileComplete(user: User): boolean {
    const hasParams = Boolean(user.params)
    const hasAnyToken = Boolean(user.googleCalendarTokens);
    return hasParams && hasAnyToken;
}
