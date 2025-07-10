import "dotenv/config";
import qs from "querystring";
import { Credentials } from "types";


export function getYandexAuthUrl(telegramId: string): string {
  const params = {
    response_type: "code",
    client_id: process.env.YANDEX_CLIENT_ID,
    redirect_uri: process.env.YANDEX_REDIRECT_URI,
    state: telegramId,
    scope: "calendar:all",
  };
  return `https://oauth.yandex.com/authorize?${qs.stringify(params)}`;
}


export async function getYandexTokens(code: string): Promise<Credentials> {
  try {
    const response = await fetch("https://oauth.yandex.com/token", {
      method: "POST",
      body: qs.stringify({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.YANDEX_CLIENT_ID,
        client_secret: process.env.YANDEX_CLIENT_SECRET,
        redirect_uri: process.env.YANDEX_REDIRECT_URI,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
        access_token: data.access_token!,
        refresh_token: data.refresh_token!,
        expiry_date: data.expires_in!,
        token_type: data.token_type!,
        scope: "calendar:all",
    };
  } catch (e) {
    throw new Error("Ошибка при получении токена Yandex: " + e);
  }
}