"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hey, I’m Nova — your concise, slightly witty product co‑pilot. How can I help? 🚀" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          model: "llama-3.1-8b-instant",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || "Request failed");
      }

      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [...prev, { role: "assistant", content: String(data.reply) }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4 py-8 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">AI Agent</h1>

        <div className="flex min-h-[50vh] flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-xl bg-zinc-900 px-4 py-2 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "self-start max-w-[85%] rounded-xl bg-zinc-100 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="self-start max-w-[85%] rounded-xl bg-zinc-100 px-4 py-2 text-zinc-900 opacity-70 dark:bg-zinc-800 dark:text-zinc-100">
              Thinking...
            </div>
          )}
          {error && (
            <div className="self-center text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message... (Cmd/Ctrl + Enter to send)"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Set your GROQ_API_KEY in <code>.env.local</code> and restart dev server.
        </p>
      </main>
    </div>
  );
}
