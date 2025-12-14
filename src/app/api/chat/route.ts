import { NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "llama-3.1-8b-instant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model } = body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      model?: string;
    };

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY. Add it to .env.local and restart dev server." },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Request body must include non-empty messages array." },
        { status: 400 }
      );
    }

    const chat = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: model || DEFAULT_MODEL,
      temperature: 0.2,
    });

    // Simple conversation: concatenate prior assistant/user messages as context
    const baseSystemPrompt =
      messages.find((m) => m.role === "system")?.content ||
      "You are Nova, a concise, friendly, and slightly witty AI product co-pilot. Your style: practical, to-the-point, prefers short bullet lists, and adds a single fitting emoji occasionally. Always be helpful, avoid fluff, and ask a brief clarifying question when needed.";

    // Inject current IST date/time to minimize temporal errors
    const istNow = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "long",
      timeStyle: "long",
    });
    const systemPrompt = `${baseSystemPrompt}\nCurrent date and time: ${istNow} (IST, UTC+05:30).`;

    const history = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt}\n\n${history}\nAssistant:`;

    const res = await chat.invoke(prompt);

    return NextResponse.json({ reply: res.content });
  } catch (err: any) {
    console.error("/api/chat error", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
