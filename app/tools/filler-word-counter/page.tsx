"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Mic, Pause, Square, Play, Moon, Sun, Loader2 } from "lucide-react";
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";
import Visualizer from "@/components/Visualizer";

// Deepgram's standardized fillers + common disfluencies
const FILLER_WORDS = [
  "uh",
  "um",
  "ah",
  "er",
  "hm",
  "hmm",
  "mhmm",
  "mm-mm",
  "uh-uh",
  "uh-huh",
  "nuh-uh",
  "like",
];

function FillerWordCounterContent() {
  const searchParams = useSearchParams();
  const shouldAutostart = searchParams.get("autostart") === "1";

  const [autostarted, setAutostarted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fillerCount, setFillerCount] = useState(0);
  const [transcript, setTranscript] = useState("");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const connectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const startRecording = useCallback((stream: MediaStream, connection: LiveClient) => {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    let mimeType = "";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    if (!mimeType) {
      setError("Your browser does not support audio recording");
      return;
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0 && connection.getReadyState() === 1) {
        connection.send(event.data);
      }
    });

    mediaRecorder.addEventListener("error", () => {
      setError("Recording error occurred");
    });

    mediaRecorder.start(250);
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    setIsPlaying(true);
    setIsReady(false);
    setFillerCount(0);
    setTranscript("");

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError) {
        if (micError instanceof DOMException) {
          switch (micError.name) {
            case "NotAllowedError":
              throw new Error("Microphone access denied. Please allow microphone permission.");
            case "NotFoundError":
              throw new Error("No microphone found. Please connect a microphone.");
            case "NotReadableError":
              throw new Error("Microphone is in use by another application.");
            default:
              throw new Error(`Microphone error: ${micError.message}`);
          }
        }
        throw micError;
      }
      mediaStreamRef.current = stream;

      const res = await fetch("/api/deepgram");
      if (!res.ok) throw new Error("Failed to get API key");
      const { key } = await res.json();

      if (!key) throw new Error("No API key returned from server");

      const deepgram = createClient(key);

      const connection = deepgram.listen.live({
        model: "nova-3",
        filler_words: true,
      });

      connectionRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        setIsReady(true);
        startRecording(stream, connection);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alt = data.channel?.alternatives?.[0];
        if (!alt) return;

        const words = alt.words || [];

        if (data.is_final) {
          const transcriptText = alt.transcript;
          if (transcriptText) {
            setTranscript((prev) => prev + " " + transcriptText);
          }

          const count = words.filter((w: { word: string }) => {
            const cleanWord = w.word.toLowerCase().trim().replace(/[.,?!]$/, "");
            return FILLER_WORDS.includes(cleanWord);
          }).length;

          if (count > 0) {
            setFillerCount((prev) => prev + count);
          }
        }
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        setIsPlaying(false);
        setIsReady(false);
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        setError("Connection error: " + (err.message || "Unknown error"));
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Something went wrong";
      setError(errorMessage);
      setIsPlaying(false);
    }
  }, [startRecording]);

  useEffect(() => {
    if (shouldAutostart && !autostarted) {
      setAutostarted(true);
      void startSession();
    }
  }, [shouldAutostart, autostarted, startSession]);

  const pauseSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopSession = () => {
    setIsPlaying(false);
    setIsReady(false);
    setIsPaused(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (connectionRef.current) {
      try {
        connectionRef.current.finish();
      } catch (e) {
        console.error("Error closing connection:", e);
      }
      connectionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <header className="fixed top-0 w-full p-6 flex items-center justify-between z-10 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70 text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            aria-label="Back to tools"
          >
            <ArrowLeft size={18} />
          </Link>
          <Link
            href="/"
            className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"
          >
            Communication Studio
          </Link>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {!isPlaying ? (
          <div className="flex flex-col items-center gap-8 animate-[fade-in_0.5s_ease-out]">
            <div className="relative group cursor-pointer" onClick={startSession}>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500" />
              <button className="relative w-32 h-32 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform duration-300">
                <Mic size={48} className="text-zinc-900 dark:text-white" />
              </button>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Start Speaking</h2>
              <p className="text-zinc-500 max-w-sm">
                For best results, speak clearly. We will count your filler words in real-time.
              </p>
            </div>

            {fillerCount > 0 && (
              <div className="mt-8 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Last Session</p>
                <p className="text-4xl font-bold mt-2">
                  {fillerCount} <span className="text-base font-normal text-zinc-400">fillers</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center gap-12 animate-[fade-in_0.5s_ease-out]">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                Detected Fillers
              </p>
              <div className="text-9xl font-extrabold tracking-tighter tabular-nums bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
                {fillerCount}
              </div>
            </div>

            <div className="w-full relative">
              <div
                className={clsx("transition-opacity duration-300", isPaused ? "opacity-30" : "opacity-100")}
              >
                <Visualizer stream={mediaStreamRef.current} isRecording={!isPaused && isReady} />
              </div>
              {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-4 py-2 bg-zinc-900/80 text-white rounded-full backdrop-blur-md text-sm font-medium">
                    Paused
                  </span>
                </div>
              )}
            </div>

            <div className="h-8">
              {!isReady ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Loader2 className="animate-spin" size={16} />
                  Connecting...
                </div>
              ) : (
                <p className="text-zinc-500 text-center px-4 line-clamp-2 max-w-lg min-h-[3rem] italic">
                  {transcript ? `"...${transcript.slice(-60)}"` : "Listening..."}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={isPaused ? resumeSession : pauseSession}
                disabled={!isReady}
                className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                aria-label={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play fill="currentColor" size={24} /> : <Pause fill="currentColor" size={24} />}
              </button>

              <button
                onClick={stopSession}
                className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
                aria-label="Stop"
              >
                <Square fill="currentColor" size={28} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

export default function FillerWordCounterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FillerWordCounterContent />
    </Suspense>
  );
}
