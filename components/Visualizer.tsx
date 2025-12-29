"use client";

import { useEffect, useRef } from "react";

interface VisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

export default function Visualizer({ stream, isRecording }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize Audio Context
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioCtx = audioContextRef.current;

    // Create Analyser
    analyserRef.current = audioCtx.createAnalyser();
    analyserRef.current.fftSize = 2048;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Create Source
    try {
      sourceRef.current = audioCtx.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
    } catch (e) {
      console.error("Error connecting stream to visualizer:", e);
    }

    let phase = 0;

    const draw = () => {
      if (!isRecording) {
         // Draw flat line or fade out
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         ctx.beginPath();
         ctx.moveTo(0, canvas.height / 2);
         ctx.lineTo(canvas.width, canvas.height / 2);
         ctx.strokeStyle = "rgba(100, 100, 100, 0.2)";
         ctx.lineWidth = 2;
         ctx.stroke();
         return;
      }

      animationRef.current = requestAnimationFrame(draw);

      if (analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(dataArray);
      }

      // Calculate average amplitude for scaling
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128; // Normalize -1 to 1
        sum += Math.abs(val);
      }
      const averageAmp = sum / bufferLength; 
      // Amplify somewhat to make it visible
      const masterAmp = Math.min(averageAmp * 5, 1); 

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      
      // Gradient stroke
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#3b82f6"); // blue-500
      gradient.addColorStop(0.5, "#8b5cf6"); // violet-500
      gradient.addColorStop(1, "#ec4899"); // pink-500
      ctx.strokeStyle = gradient;

      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height / 2;
      
      // Draw Sine Wave modulated by Audio
      for (let x = 0; x < width; x++) {
        // Create a sine wave
        // y = sin(x * frequency + phase) * amplitude
        // We modify amplitude based on audio, but also modulation
        const frequency = 0.02;
        const y = Math.sin(x * frequency + phase) * (masterAmp * 50) + height;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();

      // Update phase for movement
      phase += 0.15;
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream, isRecording]);

  useEffect(() => {
    // Cleanup audio context on unmount
    return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        audioContextRef.current = null;
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      className="w-full h-32 md:h-48 rounded-lg"
    />
  );
}
