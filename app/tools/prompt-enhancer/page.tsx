"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { Fraunces, Manrope } from "next/font/google";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";

type QuickPickCategory = "messages" | "prompts" | "refine";

type QuickPickItem = {
  label: string;
  hint: string;
  template: string;
};

type QuickPickSelection = {
  category: QuickPickCategory;
  label: string;
  hint: string;
};

const fraunces = Fraunces({ subsets: ["latin"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export default function PromptEnhancerPage() {
  const [input, setInput] = useState("");
  const [quickPicksOpen, setQuickPicksOpen] = useState(false);
  const [activeQuickPick, setActiveQuickPick] = useState<"messages" | "prompts" | "refine">(
    "messages",
  );
  const [selectedQuickPicks, setSelectedQuickPicks] = useState<QuickPickSelection[]>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const quickPicksRef = useRef<HTMLDivElement | null>(null);
  const quickPickScrollRef = useRef<HTMLDivElement | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/gemini" }), []);
  
  const messageOptions = useMemo<QuickPickItem[]>(
    () => [
      {
        label: "Email reply",
        hint: "Respond to a sender",
        template: "Write an email reply that addresses the sender's request. Context:",
      },
      {
        label: "Email follow-up",
        hint: "Nudge on a thread",
        template: "Draft a polite follow-up email about the previous message. Context:",
      },
      {
        label: "Cold outreach",
        hint: "Introduce and pitch",
        template: "Write a concise cold outreach email. Audience and goal:",
      },
      {
        label: "Client update",
        hint: "Project progress",
        template: "Write a client update covering progress, risks, and next steps. Details:",
      },
      {
        label: "Status update",
        hint: "Team summary",
        template: "Create a status update for the team. Highlights and blockers:",
      },
      {
        label: "Meeting recap",
        hint: "Decisions and actions",
        template: "Summarize a meeting with decisions, action items, and owners. Notes:",
      },
      {
        label: "Slack update",
        hint: "Short and clear",
        template: "Write a short Slack update with key points and next steps. Context:",
      },
      {
        label: "Support response",
        hint: "Helpful resolution",
        template: "Draft a support response that resolves the issue and confirms next steps. Issue:",
      },
    ],
    [],
  );

  const promptOptions = useMemo<QuickPickItem[]>(
    () => [
      {
        label: "Frontend feature",
        hint: "UX and UI scope",
        template: "Design a frontend feature. Include user flow, UI states, and acceptance criteria:",
      },
      {
        label: "Backend feature",
        hint: "Data and services",
        template: "Design a backend feature. Include data model, APIs, and edge cases:",
      },
      {
        label: "Debugging",
        hint: "Repro and fix",
        template: "Debug the issue. Include steps to reproduce, suspected cause, and fixes:",
      },
      {
        label: "Refactor plan",
        hint: "Structure improvements",
        template: "Create a refactor plan with milestones, risks, and success criteria:",
      },
      {
        label: "Testing strategy",
        hint: "Coverage plan",
        template: "Propose a testing strategy with unit, integration, and E2E coverage:",
      },
      {
        label: "API design",
        hint: "Endpoints and contracts",
        template: "Design an API with endpoints, request/response shapes, and error handling:",
      },
    ],
    [],
  );

  const refineOptions = useMemo<QuickPickItem[]>(
    () => [
      {
        label: "Add constraints",
        hint: "Scope, limits, and rules",
        template: "Constraints:",
      },
      {
        label: "Set tone",
        hint: "Voice and style",
        template: "Tone:",
      },
      {
        label: "Output format",
        hint: "Structure and layout",
        template: "Output format:",
      },
    ],
    [],
  );

  const quickPickSections = useMemo(
    () => [
      {
        id: "messages" as const,
        label: "Messages",
        description: "Email and team updates, ready to shape.",
        items: messageOptions,
      },
      {
        id: "prompts" as const,
        label: "Prompts",
        description: "Product, engineering, and debugging prompts.",
        items: promptOptions,
      },
      {
        id: "refine" as const,
        label: "Refine",
        description: "Add structure and precision to your ask.",
        items: refineOptions,
      },
    ],
    [messageOptions, promptOptions, refineOptions],
  );

  const activeSection = quickPickSections.find((section) => section.id === activeQuickPick);
  const activeSectionId = activeSection?.id ?? "messages";
  const selectedQuickPickKeys = useMemo(() => {
    return new Set(selectedQuickPicks.map((selection) => `${selection.category}:${selection.label}`));
  }, [selectedQuickPicks]);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (!quickPicksOpen) return;
      if (!quickPicksRef.current) return;
      if (quickPicksRef.current.contains(event.target as Node)) return;
      setQuickPicksOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [quickPicksOpen]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages, isLoading]);

  useEffect(() => {
    if (!quickPicksOpen) return;
    const rafId = requestAnimationFrame(() => {
      const viewport = quickPickScrollRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLDivElement | null;
      if (viewport) {
        viewport.scrollTop = 0;
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [activeSectionId, quickPicksOpen]);

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

  const toggleQuickPick = useCallback(
    (category: QuickPickCategory, option: QuickPickItem) => {
      setSelectedQuickPicks((prev) => {
        const key = `${category}:${option.label}`;
        if (prev.some((selection) => `${selection.category}:${selection.label}` === key)) {
          return [];
        }
        return [
          {
            category,
            label: option.label,
            hint: option.hint,
          },
        ];
      });
      setQuickPicksOpen(false);
    },
    [],
  );

  const handleSend = useCallback(async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    const safeInput = input || "";
    if (!safeInput.trim() || isLoading) return;
    
    const currentInput = safeInput;
    setInput(""); 
    
    const quickPickPayload = selectedQuickPicks.map(({ category, label }) => ({
      category,
      label,
    }));

    try {
      sendMessage(
        {
          text: currentInput,
          metadata: {
            quickPicks: quickPickPayload,
          },
        },
        {
          body: {
            quickPicks: quickPickPayload,
          },
        },
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [input, isLoading, sendMessage, selectedQuickPicks]);

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
                  Communication Studio
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

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 pb-48 pt-10">
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
              <textarea
                id="prompt-input"
                name="prompt"
                rows={3}
                placeholder="Ask Prompt Enhancer to reshape your prompt..."
                aria-label="Prompt input"
                className="min-h-[44px] w-full resize-none rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-inner outline-none placeholder:text-slate-400"
                ref={inputRef}
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
            <div
              ref={quickPicksRef}
              className="relative mt-3 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-inner"
            >
              <button
                type="button"
                onClick={() => setQuickPicksOpen((open) => !open)}
                className="inline-flex items-center rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                aria-expanded={quickPicksOpen}
                aria-controls="quick-picks-panel"
              >
                <span className="flex items-center gap-2">
                  <span>Quick picks</span>
                  {selectedQuickPicks.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      {selectedQuickPicks.slice(0, 2).map((selection) => (
                        <span
                          key={`${selection.category}:${selection.label}`}
                          className="rounded-full border border-white/60 bg-white/90 px-2 py-0.5"
                        >
                          {selection.label}
                        </span>
                      ))}
                      {selectedQuickPicks.length > 2 && (
                        <span className="rounded-full border border-white/60 bg-white/90 px-2 py-0.5">
                          +{selectedQuickPicks.length - 2}
                        </span>
                      )}
                    </span>
                  )}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/70 bg-white text-slate-500">
                    {quickPicksOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </span>
              </button>
              {quickPicksOpen && (
                <div
                  id="quick-picks-panel"
                  className="absolute bottom-full left-0 z-20 mb-2 h-[320px] w-[min(520px,calc(100vw-3rem))] rounded-xl border border-white/70 bg-white/95 shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
                >
                  <div className="flex h-full flex-col sm:flex-row">
                    <div className="flex w-full flex-col border-b border-white/70 sm:w-48 sm:border-b-0 sm:border-r">
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                          Categories
                        </p>
                      </div>
                      <div className="space-y-1 px-2 pb-2">
                        {quickPickSections.map((section) => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => setActiveQuickPick(section.id)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                              activeQuickPick === section.id
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:bg-white"
                            }`}
                            aria-pressed={activeQuickPick === section.id}
                          >
                            <span>{section.label}</span>
                            <ChevronRight size={12} className="opacity-60" aria-hidden />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex h-full flex-1 flex-col">
                      <div className="border-b border-white/70 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                          {activeSection?.label}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {activeSection?.description}
                        </p>
                      </div>
                      <ScrollArea ref={quickPickScrollRef} className="flex-1">
                        <div className="pr-1">
                          {activeSection?.items.map((option) => {
                            const isSelected = selectedQuickPickKeys.has(
                              `${activeSectionId}:${option.label}`,
                            );

                            return (
                              <button
                                key={option.label}
                                type="button"
                                onClick={() => toggleQuickPick(activeSectionId, option)}
                                className={`group flex w-full items-start gap-3 border-b border-white/70 px-3 py-2 text-left transition ${
                                  isSelected ? "bg-slate-900/5" : "hover:bg-white"
                                }`}
                                aria-pressed={isSelected}
                                aria-label={`Select ${option.label}`}
                              >
                                <span
                                  className={`mt-1 h-2 w-2 rounded-full ${
                                    isSelected ? "bg-slate-900" : "bg-slate-400/70"
                                  }`}
                                  aria-hidden
                                />
                                <span>
                                  <span
                                    className={`block text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                      isSelected ? "text-slate-900" : "text-slate-500"
                                    }`}
                                  >
                                    {option.label}
                                  </span>
                                  <span className="mt-1 block text-[11px] text-slate-500">
                                    {option.hint}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
