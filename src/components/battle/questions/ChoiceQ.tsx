"use client";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Q } from "@/data/levels";
import { click, speak } from "@/lib/sound";
import { shuffle } from "@/lib/text";

type CQ = Extract<Q, { tipo: "elegir" | "escuchar" | "esquiva-frase" | "zona" }>;

function optionsOf(q: CQ): { texto: string; icono?: string }[] {
  if (q.tipo === "zona") return q.zonas;
  return q.opciones.map((texto) => ({ texto }));
}

export function ChoiceQ({
  q,
  hint,
  disabled,
  onAnswer,
}: {
  q: CQ;
  hint: boolean;
  disabled: boolean;
  onAnswer: (ok: boolean, text: string) => void;
}) {
  const opts = useMemo(() => shuffle(optionsOf(q)), [q]);
  const [picked, setPicked] = useState<string | null>(null);
  const wrongs = opts.filter((o) => o.texto !== q.correcta);
  const eliminated = hint ? wrongs[0]?.texto : undefined;

  const pick = (texto: string) => {
    if (disabled || picked) return;
    click();
    setPicked(texto);
    onAnswer(texto === q.correcta, texto);
  };

  // Atajos de teclado 1-3
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= opts.length) pick(opts[n - 1].texto);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // Audio automático al abrir
  useEffect(() => {
    if (q.tipo !== "escuchar") return;
    const t = setTimeout(() => speak(q.audio, 0.85), 500);
    return () => clearTimeout(t);
  }, [q]);

  const parts = q.texto.split("___");

  return (
    <div className="space-y-4">
      {q.tipo === "escuchar" ? (
        <>
          <p className="font-bold" lang="en">{q.texto}</p>
          <div className="flex items-center justify-center gap-3">
            <motion.button
              type="button"
              aria-label="Escuchar de nuevo"
              onClick={() => speak(q.audio, 0.85)}
              className="grid h-20 w-20 place-items-center rounded-full border-4 border-[#fff3cf] bg-gradient-to-b from-[#ffe9b0] to-[#c98f2e] text-4xl shadow-[0_6px_0_#8a5d17]"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              whileTap={{ scale: 0.9 }}
            >
              🔊
            </motion.button>
            <button type="button" className="btn btn-ghost !px-3 !py-2 text-sm" onClick={() => speak(q.audio, 0.55)}>
              🐢 Más lento
            </button>
          </div>
        </>
      ) : q.tipo === "zona" ? (
        <>
          <p className="font-bold" lang="en">{q.texto}</p>
          <div className="flex items-center justify-center gap-4 rounded-xl bg-black/30 p-3">
            {q.senal?.imagen && <img src={q.senal.imagen} alt={q.senal.alt} className="h-20 w-20 drop-shadow-[0_0_10px_#fff6]" />}
            {q.senal?.luz === "roja" && (
              <div role="img" aria-label={q.senal.alt} className="flex flex-col gap-1.5 rounded-xl border-2 border-[#333] bg-[#15171c] p-2">
                <motion.span className="h-7 w-7 rounded-full bg-[#ff3b30]" animate={{ boxShadow: ["0 0 6px #ff3b30", "0 0 22px #ff3b30"] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.8 }} />
                <span className="h-7 w-7 rounded-full bg-[#4a3b10]" />
                <span className="h-7 w-7 rounded-full bg-[#10351d]" />
              </div>
            )}
            <motion.span
              className="text-5xl"
              animate={{ x: picked ? 0 : [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              aria-hidden
            >
              🏇
            </motion.span>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {q.tipo === "elegir" && q.imagen && (
            <div className="flex justify-center rounded-xl bg-black/30 p-3">
              <img src={q.imagen} alt="Señal de tránsito" className="h-24 w-24 drop-shadow-[0_0_12px_#fff6]" />
            </div>
          )}
          <p className="text-lg font-bold" lang="en">
            {parts.length > 1 ? (
              <>
                {parts[0]}
                <span className="mx-1 inline-block min-w-16 border-b-4 border-[var(--gold)] px-2 text-center text-[var(--gold)]">
                  {picked ?? "\u00A0"}
                </span>
                {parts[1]}
              </>
            ) : (
              q.texto
            )}
          </p>
        </div>
      )}

      <div className="grid gap-2.5">
        {opts.map((o, i) => {
          const isPicked = picked === o.texto;
          const right = o.texto === q.correcta;
          const gone = eliminated === o.texto && !picked;
          const state = picked ? (right ? "right" : isPicked ? "wrong" : "idle") : "idle";
          return (
            <motion.button
              key={o.texto}
              type="button"
              disabled={disabled || !!picked || gone}
              onClick={() => pick(o.texto)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: gone ? 0.25 : 1, y: 0, scale: state === "right" ? 1.03 : 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 22 }}
              whileHover={disabled || picked || gone ? undefined : { scale: 1.03, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-3 overflow-hidden rounded-xl border-2 px-4 py-3 text-left font-bold"
              style={{
                borderColor: state === "right" ? "#7bd88f" : state === "wrong" ? "#ff6a5a" : "#5b6f9f",
                background:
                  state === "right"
                    ? "linear-gradient(90deg,#1f6b3a,#2f9e4f)"
                    : state === "wrong"
                      ? "linear-gradient(90deg,#7a1f1f,#b32d2d)"
                      : "linear-gradient(90deg,#1d2b4f,#26365e)",
                textDecoration: gone ? "line-through" : undefined,
              }}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/40 text-sm text-[var(--gold)]">
                {o.icono ?? i + 1}
              </span>
              <span lang="en">{o.texto}</span>
              {state === "wrong" && (
                <>
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,#fff_50%,transparent_55%)]" style={{ animation: "shine 0.5s ease-out" }} />
                </>
              )}
              {state === "right" && <span className="ml-auto">✔</span>}
              {state === "wrong" && <span className="ml-auto">✖</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
