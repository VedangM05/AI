import { NextResponse } from "next/server";
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { createChatGraph } from "@/lib/chat-graph";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "llama-3.1-8b-instant";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, threadId } = body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      model?: string;
      threadId?: string;
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

    const currentThreadId = threadId || `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Optimization: Filter to keep only the recent 20 messages.
    // This maintains sufficient context for the conversation while minimizing 
    // token usage and computational load on the LLM.
    const recentMessages = messages.slice(-10);

    // Convert raw messages to LangChain format
    const langChainMessages: BaseMessage[] = recentMessages.map((m) => {
      if (m.role === "user") return new HumanMessage(m.content);
      if (m.role === "assistant") return new AIMessage(m.content);
      return new SystemMessage(m.content);
    });

    // Get the graph (this will retrieve the cached instance if it exists)
    const graph = createChatGraph(
      process.env.GROQ_API_KEY,
      model || DEFAULT_MODEL
    );

    // Invoke the graph with the manually constructed history.
    // Since the graph is stateless, we pass the history every time.
    const result = await graph.invoke(
      { messages: langChainMessages },
      { configurable: { thread_id: currentThreadId } }
    );

    const state = result as { messages: BaseMessage[] };
    const aiMessages = state.messages.filter((m: BaseMessage) => m instanceof AIMessage);
    const reply = (aiMessages[aiMessages.length - 1]?.content as string) || "";

    return NextResponse.json({ 
      reply,
      threadId: currentThreadId,
    });
  } catch (err: any) {
    console.error("/api/chat error", err);
    
    if (err?.message?.includes("API key") || err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
      return NextResponse.json(
        { 
          error: "API key error. Please check your GROQ_API_KEY environment variable.",
          details: err?.message 
        },
        { status: 401 }
      );
    }
    
    if (err?.message?.includes("ECONNREFUSED") || err?.message?.includes("fetch failed")) {
      return NextResponse.json(
        { 
          error: "Connection error. Please check your API configuration and network connection.",
          details: err?.message 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}