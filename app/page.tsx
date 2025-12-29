import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mic, Sparkles, Timer, Wand2 } from "lucide-react";
import { Fraunces, Manrope } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], display: "swap" });

const tools = [
  {
    id: "filler-word-counter",
    name: "Filler Word Counter",
    description: "Real-time detection of verbal fillers with instant feedback and session timing.",
    tags: ["Realtime", "Speech", "Nova-3"],
    href: "/tools/filler-word-counter?autostart=1",
    icon: Mic,
    accent: "from-sky-500 via-blue-500 to-indigo-600",
    status: "Ready",
    previewSrc: "/filler-word-counter.png",
    previewAlt: "Filler Word Counter preview",
  },
];

const upcomingTools = [
  {
    id: "pace-coach",
    name: "Pace Coach",
    description: "Live pacing insights with gentle nudges when you drift too fast or slow.",
    icon: Timer,
  },
  {
    id: "clarity-lens",
    name: "Clarity Lens",
    description: "Find long-winded moments and replace them with crisp, clear phrasing.",
    icon: Sparkles,
  },
  {
    id: "energy-pulse",
    name: "Energy Pulse",
    description: "Track vocal energy and dynamics to keep your delivery engaging.",
    icon: Wand2,
  },
];

export default function Home() {
  return (
    <main
      className={`${manrope.className} min-h-screen text-slate-900`}
      style={{
        backgroundImage:
          "radial-gradient(1200px 500px at 15% -10%, rgba(56, 189, 248, 0.22), transparent 55%), radial-gradient(900px 600px at 85% 10%, rgba(251, 146, 60, 0.18), transparent 60%), linear-gradient(140deg, #f8fbff 0%, #f3f5ff 45%, #fff6ee 100%)",
      }}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(255,255,255,0.7),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.28),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.2),transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.2),transparent_65%)] blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/60 bg-white/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)] ring-2 ring-white/70" />
                Voice Insights
              </div>
              <h1
                className={`${fraunces.className} text-balance text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl`}
              >
                A glass-smooth studio of voice tools, shaped to refine how you speak.
              </h1>
              <p className="max-w-2xl text-pretty text-base text-slate-600 md:text-lg">
                Each tool focuses on one coaching signal. Tap a card to launch a session instantly and keep
                your delivery crisp.
              </p>
            </div>
            <div className="w-full md:w-[340px]">
              <div className="rounded-3xl border border-white/60 bg-white/50 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Studio Status
                  <span className="rounded-full border border-white/70 bg-white/80 px-2 py-1 text-[10px] text-slate-500">
                    Beta
                  </span>
                </div>
                <div className="mt-4 text-2xl font-semibold text-slate-900">
                  1 live · 3 in build
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Launch tools in a single tap and stay in flow.
                </p>
              </div>
            </div>
          </header>

          <section className="mt-12 grid gap-6 md:grid-cols-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="group relative flex h-full flex-col gap-4 rounded-xl border border-white/60 bg-white/40 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-white"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/70 via-white/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="relative flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-lg transition-transform duration-200 ease-out group-hover:-translate-y-0.5`}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 transition-transform duration-200 ease-out group-hover:scale-[1.03]">
                      {tool.status}
                    </span>
                  </div>

                  <div className="relative space-y-2">
                    <h2
                      className={`${fraunces.className} text-lg font-semibold text-slate-900 transition-transform duration-200 ease-out group-hover:-translate-y-0.5`}
                    >
                      {tool.name}
                    </h2>
                    <p className="text-sm text-slate-600 line-clamp-2 transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
                      {tool.description}
                    </p>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-white/60 bg-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] transition-transform duration-200 ease-out group-hover:scale-[1.01]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/20 to-transparent" />
                    <div className="relative aspect-[16/10] p-2">
                      <Image
                        src={tool.previewSrc}
                        alt={tool.previewAlt}
                        fill
                        sizes="(min-width: 1024px) 28vw, (min-width: 768px) 40vw, 100vw"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  <div className="relative flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/70 bg-white/60 px-3 py-1 transition-transform duration-200 ease-out group-hover:scale-[1.03] hover:scale-105"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="relative mt-auto flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Instant start</span>
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-0.5 hover:bg-slate-900"
                    >
                      Use tool
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="relative flex h-full flex-col justify-between gap-6 rounded-xl border border-white/60 bg-white/35 p-5 text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="absolute inset-0 rounded-xl border border-white/40" />
              <div className="space-y-2">
                <h2 className={`${fraunces.className} text-lg font-semibold text-slate-900`}>
                  More tools coming soon
                </h2>
                <p className="text-sm text-slate-600 line-clamp-3">
                  We are building a full suite of speaking insights. Upcoming tools will launch right here.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      className="flex items-center gap-4 rounded-xl border border-white/70 bg-white/60 p-3 shadow-sm transition-transform duration-200 ease-out hover:-translate-y-0.5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-slate-500 transition-transform duration-200 ease-out">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800">{tool.name}</h3>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{tool.description}</p>
                      </div>
                      <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
