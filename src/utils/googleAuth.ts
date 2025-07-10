import { google } from "googleapis";
import "dotenv/config";
import { Credentials } from "types";

// Клиент для получения токенов OAuth2 от Google
// Используется для аутентификации пользователей и получения доступа к их календарям
const googleOauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Генерирует URL для аутентификации пользователя через Google OAuth2.
 * @param {string} telegramId - Идентификатор пользователя в Telegram.
 * @returns {string} URL для аутентификации.
 */
export function getGoogleAuthUrl(telegramId: string) {
  return googleOauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/tasks"],
    prompt: "consent",
    state: telegramId,
  });
}

/**
 * Получает токены доступа от Google по предоставленному коду аутентификации.
 * @param {string} code - Код, полученный после аутентификации пользователя.
 * @returns {Promise<{ tokens: object }>} Объект с токенами доступа.
 */
export async function getGoogleTokens(code: string): Promise<Credentials> {
  const { tokens: data } = await googleOauth2Client.getToken(code);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
    token_type: data.token_type,
    scope: data.scope,
  };
}

export { googleOauth2Client };
