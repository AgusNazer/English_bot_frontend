"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Mic, Square, Volume2, AlertCircle, Loader2 } from "lucide-react";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null); 

  const startListening = () => {
    setError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Tu navegador no soporta dictado de voz de forma nativa. Probá usando Safari en iOS o Chrome.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES"; //dicta en español
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      setError(
        "Error capturando el audio. Seteá bien los permisos del micrófono.",
      );
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = async (event: any) => {
      const textResult = event.results[0][0].transcript;
      if (!textResult) return;

      setLoading(true);
      try {
        //  API en Render
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/vent`,
          {
            user_id: "agus_iphone",
            detected_text: textResult,
          },
        );

        setResponse(res.data);

        // Reproducción automática del archivo MP3 devuelto
        if (res.data.audio_url) {
      // 1. Frenamos cualquier audio que haya quedado colgado antes
      stopAudio(); 

      // 2. Creamos la nueva instancia de audio y la guardamos en la referencia
      const audio = new Audio(res.data.audio_url);
      audioRef.current = audio;
      
      // 3. PASAMOS EL ESTADO A TRUE INMEDIATAMENTE PARA QUE APAREZCA EL BOTÓN DE PAUSA
      setIsPlayingAudio(true);

      // 4. Le damos Play
      audio.play().catch(e => {
        console.error("Autoplay bloqueado por el navegador:", e);
        setIsPlayingAudio(false);
      });

      // 5. Cuando el audio termine solito, volvemos el estado a false para ocultar el botón
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  } catch (err) {
    console.error(err);
    setError("Se pudrió todo al conectar con el backend.");
  } finally {
    setLoading(false);
  }
};

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // 1. REPRODUCIR: Guarda la referencia y maneja los estados
const playAudio = (url: string) => {
  stopAudio(); // Frena cualquier audio previo que haya quedado colgado

  const audio = new Audio(url);
  audioRef.current = audio;
  setIsPlayingAudio(true);

  audio.play().catch(e => {
    console.error("Autoplay bloqueado por el navegador:", e);
    setIsPlayingAudio(false);
  });

  audio.onended = () => {
    setIsPlayingAudio(false);
  };
};

// 2. FRENAR: Pausa el audio de raíz y lo vuelve a cero
const stopAudio = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0; // Lo manda al inicio
    setIsPlayingAudio(false);
  }
};

  const playAudioManual = () => {
    if (response?.audio_url) {
      const audio = new Audio(response.audio_url);
      audio.play();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-md text-center space-y-8">
  {/* Encabezado */}
  <div className="space-y-2">
    <h1 className="text-4xl font-extrabold tracking-tight text-blue-500">
      English AI Trainer
    </h1>
    <p className="text-sm text-slate-400">
      Aprende Inglés con tu teléfono, en cualquier momento.
    </p>
  </div>

  {/* Botón Central de Control e Interrupción de Audio */}
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="flex items-center space-x-6">
      
      {/* Botón Principal (Grabar / Frenar Escucha) */}
      <button
        onClick={isRecording ? stopListening : startListening}
        disabled={loading}
        className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 disabled:opacity-50 ${
          isRecording
            ? "bg-red-600 animate-pulse hover:bg-red-700"
            : "bg-gradient-to-tr from-blue-600 to-indigo-500 hover:scale-105"
        }`}
      >
        {loading ? (
          <Loader2 className="h-14 w-14 animate-spin" />
        ) : isRecording ? (
          <Square className="h-14 w-14 fill-current" />
        ) : (
          <Mic className="h-14 w-14" />
        )}
      </button>

      {/* BOTÓN DE PARADA DE AUDIO: Aparece al lado solo si la IA está reproduciendo voz */}
      {isPlayingAudio && (
        <button
          onClick={stopAudio}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition hover:scale-110"
          title="Stop Audio"
        >
          <Square className="h-6 w-6 fill-current" />
        </button>
      )}

    </div>

    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
      {loading
        ? "Procesando con Gemini..."
        : isRecording
          ? "Grabando... Tocá para frenar"
          : "Tocá para hablar"}
    </p>
  </div>

  {/* Alertas de Error */}
  {error && (
    <div className="flex items-center space-x-2 rounded-lg bg-red-950/50 border border-red-800 p-4 text-sm text-red-400 text-left">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <span>{error}</span>
    </div>
  )}

  {/* Tarjeta de Respuesta de la IA */}
  {response && (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-left space-y-4">
      <div>
        <span className="text-xs font-bold uppercase text-slate-500">
          Dijiste:
        </span>
        <p className="text-slate-300 font-medium mt-1">{response.user_said}</p>
      </div>

      <div className="border-t border-slate-800 pt-3">
        <span className="text-xs font-bold uppercase text-blue-400">
          Respuesta (AI):
        </span>
        <p className="text-slate-200 mt-1 whitespace-pre-line">{response.reply}</p>
      </div>

      {response.audio_url && !isPlayingAudio && (
        <button
          onClick={() => playAudio(response.audio_url)}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 px-4 text-sm font-medium transition"
        >
          <Volume2 className="h-4 w-4" />
          <span>Escuchar de nuevo</span>
        </button>
      )}
    </div>
  )}
</div>
    </main>
  );
}
