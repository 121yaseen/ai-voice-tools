"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { Fraunces, Manrope } from "next/font/google";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

const fraunces = Fraunces({ subsets: ["latin"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export default function PromptEnhancerPage() {
  const [input, setInput] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/gemini" }), []);
  
  const { messages, sendMessage, status, error: chatError } = useChat({
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const formatTime = useMemo(
    () => (date: Date | undefined) =>
      (date || new Date()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const getMessageText = useCallback((message: UIMessage) => {
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map(part => part.text)
      .join('');
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages, isLoading]);

  const renderMessageContent = useCallback((text: string) => {
    const segments = text.split("**");
    return segments.map((segment, index) =>
      index % 2 === 1 ? (
        <strong key={`${segment}-${index}`} className="font-semibold text-inherit">
          {segment}
        </strong>
      ) : (
        <span key={`${segment}-${index}`}>{segment}</span>
      ),
    );
  }, []);

  const handleCopy = useCallback(async (content: string, id: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      // Error handling ignored for brevity
    }
  }, []);

  const handleSend = useCallback(async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    const safeInput = input || "";
    if (!safeInput.trim() || isLoading) return;
    
    const currentInput = safeInput;
    setInput(""); 
    
    try {
      sendMessage({ text: currentInput });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [input, isLoading, sendMessage]);

  return (
    <main
      className={`${manrope.className} min-h-screen text-slate-900`}
      style={{
        backgroundImage:
          "radial-gradient(1200px 500px at 15% -10%, rgba(56, 189, 248, 0.2), transparent 55%), radial-gradient(900px 600px at 85% 10%, rgba(251, 146, 60, 0.18), transparent 60%), linear-gradient(140deg, #f8fbff 0%, #f4f5ff 45%, #fff6ee 100%)",
      }}
    >
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(255,255,255,0.7),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.28),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.2),transparent_60%)] blur-3xl" />

        <header className="sticky top-0 z-10 border-b border-white/40 bg-white/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                aria-label="Back to tools"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Voice Insights
                </p>
                <h1 className={`${fraunces.className} text-xl font-semibold text-slate-900`}>
                  Prompt Enhancer
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm md:flex">
              <Sparkles size={14} />
              Draft Mode
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 pb-32 pt-10">
          <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Active Session
                </p>
                <p className={`${fraunces.className} mt-2 text-2xl text-slate-900`}>
                  Shape prompts into high‑signal instructions
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Provide context, audience, constraints, and desired output format.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-xs font-semibold text-slate-500 shadow-sm md:block">
                {messages.filter(m => m.role === 'assistant').length} refinements · {messages.filter(m => m.role === 'user').length} drafts
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-center">
                <div className="max-w-[520px] rounded-3xl border border-white/70 bg-white/70 px-6 py-5 text-sm text-slate-600 shadow-[0_16px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  Start by dropping a rough prompt. I’ll restructure it with clearer roles, constraints, and output format.
                </div>
              </div>
            )}
            {messages.map((message) => {
              const isUser = message.role === "user";
              const label = isUser ? "You" : "Prompt Enhancer";
              const timestamp = formatTime(undefined); // Timestamps managed locally as UIMessage doesn't have it in v6
              const messageText = getMessageText(message);

              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[80%] rounded-3xl border px-5 py-4 shadow-[0_16px_30px_rgba(15,23,42,0.08)] ${
                      isUser
                        ? "border-slate-900/10 bg-slate-900 text-white"
                        : "border-white/70 bg-white/80 text-slate-700 backdrop-blur"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <span className={isUser ? "text-white/70" : "text-slate-400"}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className={isUser ? "text-white/60" : "text-slate-400"}>{timestamp}</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(messageText, message.id)}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                            isUser
                              ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
                              : "border-white/60 bg-white/70 text-slate-500 hover:bg-white"
                          }`}
                          aria-label="Copy message"
                          disabled={!messageText}
                        >
                          {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {message.parts.map((part, i) => {
                        if (part.type === 'text') {
                          return <div key={i}>{renderMessageContent(part.text)}</div>;
                        }
                        return null;
                      })}
                      {isLoading && !isUser && message === messages[messages.length - 1] && (
                        <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-current/70 align-middle" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        <div className="fixed bottom-6 left-1/2 z-10 w-[min(760px,calc(100%-2.5rem))] -translate-x-1/2">
          <div className="rounded-[32px] border border-white/70 bg-white/70 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex items-end gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Wand2 size={18} />
              </div>
              <textarea
                id="prompt-input"
                name="prompt"
                rows={1}
                placeholder="Ask Prompt Enhancer to reshape your prompt..."
                aria-label="Prompt input"
                className="min-h-[44px] w-full resize-none rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-inner outline-none placeholder:text-slate-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
            {chatError && (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-600">
                {chatError.message || "Something went wrong."}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">Add constraints</span>
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">Set tone</span>
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">Output format</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}