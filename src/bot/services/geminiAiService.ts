import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { CustomContext } from "../../types";
import { PromptParams, generatePrompt } from "../../utils/promptGenerator";
import { getGoogleCalendarEvents, getGoogleCalendarTasks, getGoogleCalendarTime } from "./googleCalendarService";
import { findUser, getUserTokens } from "./userService";
import db from "../../db";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function getAiResponse(basePrompt: string, request?: string) {
    const contents = [
        {
            role: "user",
            parts: [{ text: basePrompt }],
        },
    ];

    if (request && request.trim()) {
        contents.push({
            role: "user",
            parts: [{ text: request }],
        });
    }

    const response = await ai.models.generateContent({
        model: "gemma-3-27b-it",
        contents,
        config: {
            temperature: 1.0,
        }
    });

    return response.text;
}

export async function getMotivationByRequest(ctx: CustomContext) {
    const user = await findUser(ctx.db, ctx.from?.id!);
    const userTokens = (await getUserTokens(user!))!
    
    const { isoTime, timeOfDay } = (await getGoogleCalendarTime(ctx.db, ctx.from?.id!, userTokens))!;
    const eventsResult = await getGoogleCalendarEvents(ctx.db, ctx.from?.id!, userTokens);
    const tasksResult = await getGoogleCalendarTasks(ctx.db, ctx.from?.id!, userTokens);

    if (!eventsResult || !tasksResult) return;

    const events = eventsResult.map(event => `${event.start?.dateTime}/${event.end?.dateTime} – ${event.summary}`).join('\n');
    const tasks = tasksResult.map(task => `${task.title} – ${task.status === "completed" ? "Done" : "Undone"}`).join('\n');

    const params: PromptParams = {
        name: user?.params?.name!,
        gender: user?.params?.gender!,
        addressing: user?.params?.addressing! as "formal" | "informal",
        persona: user?.params?.persona!,
    }

    const prompt = generatePrompt(params, events, tasks, timeOfDay, isoTime );
    
    console.log(prompt);

    const response = await getAiResponse(prompt, ctx.msg?.text);

    return response;
}

export async function sendReport(telegramId: number, timeOfDay: "morning" | "evening") {
    const user = await findUser(db, telegramId);
    const userTokens = (await getUserTokens(user!))!
    
    const { isoTime } = (await getGoogleCalendarTime(db, telegramId, userTokens))!;
    const eventsResult = await getGoogleCalendarEvents(db, telegramId, userTokens);
    const tasksResult = await getGoogleCalendarTasks(db, telegramId, userTokens);

    if (!eventsResult || !tasksResult) return;

    const events = eventsResult.map(event => `${event.start?.dateTime}/${event.end?.dateTime} – ${event.summary}`).join('\n');
    const tasks = tasksResult.map(task => `${task.title} – ${task.status === "completed" ? "Done" : "Undone"}`).join('\n');

    const params: PromptParams = {
        name: user?.params?.name!,
        gender: user?.params?.gender!,
        addressing: user?.params?.addressing! as "formal" | "informal",
        persona: user?.params?.persona!,
    }

    const prompt = generatePrompt(params, events, tasks, timeOfDay, isoTime );
    
    console.log(prompt);

    const response = await getAiResponse(prompt);

    return response;
}