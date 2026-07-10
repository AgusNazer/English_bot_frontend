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
          const audio = new Audio(res.data.audio_url);
          audio.play().catch((e) => {
            console.error("El navegador bloqueó el autoplay del audio:", e);
            setError(
              "Hacé clic en el botón de escuchar, el navegador bloqueó el inicio automático.",
            );
          });
        }
      } catch (err) {
        console.error(err);
        setError("Se pudrió todo al conectar con el backend de Render.");
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
          <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
            BadDay AI
          </h1>
          <p className="text-sm text-slate-400">
            Aprende Ingles con tu telefono, en cualquier momento.
          </p>
        </div>

        {/* Botón Central de Control */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <button
            onClick={isRecording ? stopListening : startListening}
            disabled={loading}
            className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 disabled:opacity-50 ${
              isRecording
                ? "bg-red-600 animate-pulse hover:bg-red-700"
                : "bg-gradient-to-tr from-red-600 to-orange-500 hover:scale-105"
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
              <p className="text-slate-300 font-medium">{response.user_said}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-xs font-bold uppercase text-red-400">
                Respuesta (AI):
              </span>
              <p className="text-slate-200 mt-1">{response.reply}</p>
            </div>

            {response.audio_url && (
              <button
                onClick={playAudioManual}
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
