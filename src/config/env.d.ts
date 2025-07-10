declare namespace NodeJS {
  interface ProcessEnv {
    PORT: number;
    TEST_BOT_TOKEN: string;
    BOT_TOKEN: string;
    REDIS_URL: string;
    DATABASE_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_REDIRECT_URI: string;
    YANDEX_CLIENT_ID: string;
    YANDEX_CLIENT_SECRET: string;
    YANDEX_REDIRECT_URI: string;
    GEMINI_API_KEY: string;
    ENCRYPTION_KEY: string;
  }
}