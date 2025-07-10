import { Middleware } from "grammy";
import { CustomContext } from "../../types";
import db from "../../db";
import { redis } from "../../cache";

/**
 * Middleware для инъекции базы данных в контекст.
 * Позволяет использовать базу данных в других middleware и обработчиках.
 */
export const injectDb: Middleware<CustomContext> = (ctx, next) => {
    ctx.redis = redis;
    ctx.db = db;
    return next();
}