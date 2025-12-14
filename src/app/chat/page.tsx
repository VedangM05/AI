"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm your Panel of Experts AI assistant. I consult multiple specialized experts to provide comprehensive answers. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [expandedExperts, setExpandedExperts] = useState<Set<number>>(new Set());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentExpert, setCurrentExpert] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { 
      role: "user", 
      content: input.trim(),
      timestamp: new Date(),
    };
    const newMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          threadId: threadId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || "Request failed");
      }

      const data = (await res.json()) as { 
        reply: string; 
        threadId: string;
      };
      setThreadId(data.threadId);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: String(data.reply),
        timestamp: new Date(),
      }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-black dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-black to-slate-800 shadow-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                AI Assistant
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powered by LangChain & LangGraph
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl bg-white/60 backdrop-blur-sm dark:bg-slate-800/60">
            <div className="flex-1 space-y-4 p-4 sm:p-6">
          {messages.map((m, i) => (
            <div
              key={i}
                  className={`flex gap-3 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-black to-slate-800 text-sm font-medium text-white shadow-md">
                      AI
                    </div>
                  )}
                  <div
                    className={`group relative max-w-[85%] sm:max-w-[75%] ${
                m.role === "user"
                        ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-black to-slate-900 px-4 py-3 text-white shadow-lg"
                        : "rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-slate-900 shadow-md dark:bg-slate-700 dark:text-slate-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {m.content}
                    </div>
                    {m.timestamp && (
                      <div
                        className={`mt-1 text-xs opacity-70 ${
                          m.role === "user" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
                        }`}
                        suppressHydrationWarning
                      >
                        {new Date(m.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-sm font-medium text-white shadow-md">
                      You
                    </div>
                  )}
            </div>
          ))}
          {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-black to-slate-800 text-sm font-medium text-white shadow-md">
                    AI
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 shadow-md dark:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
              Thinking...
                      </span>
                    </div>
                  </div>
            </div>
          )}
          {error && (
                <div className="mx-auto max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 shadow-md dark:bg-red-900/20 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-lg focus-within:border-black focus-within:ring-2 focus-within:ring-black/20 dark:border-slate-700 dark:bg-slate-700">
              <textarea
                ref={textareaRef}
            value={input}
                onChange={handleInputChange}
            onKeyDown={onKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                rows={1}
                className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                style={{ minHeight: "48px", maxHeight: "200px" }}
              />
            </div>
          <button
            onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-black to-slate-900 text-white shadow-lg transition-all hover:from-slate-900 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
          </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          </p>
        </div>
      </footer>
    </div>
  );
}
