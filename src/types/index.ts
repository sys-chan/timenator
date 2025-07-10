import { Context } from "grammy";
import db from "../db";
import { redis } from "../cache";

export type CustomContext = Context & {
    redis: typeof redis;
    db: typeof db;
}

export interface Credentials {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    token_type?: string | null;
    scope?: string;
}

export type UserParams = {
    name?: string;
    gender?: "male" | "female",
    addressing?: string,
    morningReportTime?: string,
    eveningReportTime?: string,
    persona?: "timenator" | "animenator" | "motivator" | "cowinator";
}