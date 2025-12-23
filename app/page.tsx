"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Pause, Square, Play, Moon, Sun, Loader2 } from "lucide-react";
import Visualizer from "../components/Visualizer";
import { clsx } from "clsx";
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";

const FILLER_WORDS = ["uh", "um", "ah", "er", "hm", "hmm", "oh", "like", "you know"];

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isPlaying, setIsPlaying] = useState(false); // Valid session active
  const [isPaused, setIsPaused] = useState(false);   // Session paused
  const [isReady, setIsReady] = useState(false);     // Socket/Mic ready
  const [error, setError] = useState<string | null>(null);
  
  const [fillerCount, setFillerCount] = useState(0);
  const [transcript, setTranscript] = useState("");
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const connectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize theme
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const startRecording = useCallback((stream: MediaStream, connection: LiveClient) => {
    // Try different audio formats in order of preference
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    
    let mimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    
    if (!mimeType) {
      console.error('No supported audio format found');
      setError('Your browser does not support audio recording');
      return;
    }
        
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0 && connection.getReadyState() === 1) {
        connection.send(event.data);
      }
    });

    mediaRecorder.addEventListener('error', (event) => {
      console.error('MediaRecorder error:', event);
      setError('Recording error occurred');
    });

    // Start recording with 250ms chunks for low latency
    mediaRecorder.start(250);
    console.log('Recording started');
  }, []);

  const startSession = async () => {
    setError(null);
    setIsPlaying(true);
    setIsReady(false);
    setFillerCount(0);
    setTranscript("");

    try {
      // 1. Get Microphone Permission
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError) {
        // Handle specific microphone errors
        if (micError instanceof DOMException) {
          switch (micError.name) {
            case 'NotAllowedError':
              throw new Error('Microphone access denied. Please allow microphone permission in your browser settings and reload the page.');
            case 'NotFoundError':
              throw new Error('No microphone found. Please connect a microphone and try again.');
            case 'NotReadableError':
              throw new Error('Microphone is in use by another application. Please close other apps using the microphone.');
            case 'OverconstrainedError':
              throw new Error('Could not find a suitable microphone.');
            default:
              throw new Error(`Microphone error: ${micError.message}`);
          }
        }
        throw micError;
      }
      mediaStreamRef.current = stream;

      // 2. Get API Key from our backend
      const res = await fetch("/api/deepgram");
      if (!res.ok) throw new Error("Failed to get API key");
      const { key } = await res.json();
      
      if (!key) throw new Error("No API key returned from server");

      // 3. Create Deepgram client and live connection using the SDK
      const deepgram = createClient(key);
      
      const connection = deepgram.listen.live({
        model: "nova-2",
        filler_words: true,
        punctuate: true,
        smart_format: true,
        language: "en",
      });

      connectionRef.current = connection;

      // Handle connection open
      connection.on(LiveTranscriptionEvents.Open, () => {
        setIsReady(true);
        startRecording(stream, connection);
      });

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alt = data.channel?.alternatives?.[0];
        if (!alt) return;

        const words = alt.words || [];
        
        // Count fillers only on final results to avoid double counting
        if (data.is_final) {
          const transcriptText = alt.transcript;
          if (transcriptText) {
            setTranscript(prev => prev + " " + transcriptText);
          }
          
          const count = words.filter((w: { word: string }) => {
            const cleanWord = w.word.toLowerCase().replace(/[^a-z]/g, '');
            return FILLER_WORDS.includes(cleanWord);
          }).length;
          
          if (count > 0) {
            setFillerCount(prev => prev + count);
          }
        }
      });

      // Handle metadata
      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      });

      // Handle connection close
      connection.on(LiveTranscriptionEvents.Close, () => {
        setIsPlaying(false);
        setIsReady(false);
      });

      // Handle errors
      connection.on(LiveTranscriptionEvents.Error, (err) => {
        setError("Connection error: " + (err.message || "Unknown error"));
      });

    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Something went wrong";
      setError(errorMessage);
      setIsPlaying(false);
    }
  };

  const pauseSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
    }
  };

  const resumeSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
    }
  };

  const stopSession = () => {
     setIsPlaying(false);
     setIsReady(false);
     setIsPaused(false);
     
     // Stop MediaRecorder first
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
         mediaRecorderRef.current.stop();
     }
     
     // Close Deepgram connection using SDK's finish method
     // This sends the CloseStream message and closes cleanly
     if (connectionRef.current) {
         try {
           connectionRef.current.finish();
         } catch (e) {
           console.error("Error closing connection:", e);
         }
         connectionRef.current = null;
     }
     
     // Stop all media tracks
     if (mediaStreamRef.current) {
         mediaStreamRef.current.getTracks().forEach(track => track.stop());
     }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 font-sans">
      
      {/* Header */}
      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-10 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          VoiceInsights
        </h1>
        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        
        {!isPlaying ? (
            // Idle State
            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                <div className="relative group cursor-pointer" onClick={startSession}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
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
                        <p className="text-4xl font-bold mt-2">{fillerCount} <span className="text-base font-normal text-zinc-400">fillers</span></p>
                     </div>
                )}
            </div>
        ) : (
            // Active Session State
            <div className="w-full max-w-2xl flex flex-col items-center gap-12 animate-in slide-in-from-bottom-8 duration-500">
                
                {/* Stats */}
                <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Detected Fillers</p>
                    <div className="text-9xl font-extrabold tracking-tighter tabular-nums bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
                        {fillerCount}
                    </div>
                </div>

                {/* Visualizer */}
                <div className="w-full relative">
                    <div className={clsx(
                        "transition-opacity duration-300",
                        isPaused ? "opacity-30" : "opacity-100"
                    )}>
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

                {/* Status Text */}
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

                {/* Controls */}
                <div className="flex items-center gap-6">
                    {/* Pause/Resume */}
                    <button 
                        onClick={isPaused ? resumeSession : pauseSession}
                        disabled={!isReady}
                        className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        {isPaused ? <Play fill="currentColor" size={24} /> : <Pause fill="currentColor" size={24} />}
                    </button>
                    
                    {/* Stop */}
                    <button 
                        onClick={stopSession}
                        className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 hover:scale-105 transition-transform"
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
