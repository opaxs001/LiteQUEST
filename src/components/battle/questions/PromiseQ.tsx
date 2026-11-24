"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Q } from "@/data/levels";
import { click } from "@/lib/sound";
import { igual, shuffleDistinct } from "@/lib/text";

type PQ = Extract<Q, { tipo: "promesa" }>;

const SPOTS = [
  { x: 14, y: 30 },
  { x: 40, y: 72 },
  { x: 64, y: 28 },
  { x: 86, y: 68 },
  { x: 50, y: 18 },
  { x: 24, y: 78 },
];

/** «Proteger al aliado»: une las estrellas de la promesa en orden. */
export function PromiseQ({
  q,
  hint,
  disabled,
  onAnswer,
}: {
  q: PQ;
  hint: boolean;
  disabled: boolean;
  onAnswer: (ok: boolean, text: string) => void;
}) {
  const nodes = useMemo(() => shuffleDistinct(q.nodos).map((t, i) => ({ t, ...SPOTS[i] })), [q]);
  const [chain, setChain] = useState<string[]>([]);
  const expected = q.correcta.replace(/[.!?]$/, "").split(" ");
  const nextHint = hint ? q.nodos.find((n) => q.correcta.includes(n.replace(/[.!?]$/, "")) && !chain.includes(n)) : undefined;

  const toggle = (t: string) => {
    if (disabled) return;
    click();
    setChain((c) => (c[c.length - 1] === t ? c.slice(0, -1) : c.includes(t) ? c : [...c, t]));
  };
  const pts = chain.map((t) => nodes.find((n) => n.t === t)!);
  void expected;
  const sentence = chain.join(" ");

  return (
    <div className="space-y-3">
      {q.contexto && <p className="rounded-lg bg-white/5 px-3 py-2 text-sm italic text-[#cdd6ea]" lang="en">“{q.contexto}”</p>}
      <p className="font-bold" lang="en">{q.texto}</p>
      <div className="relative h-44 overflow-hidden rounded-xl border-2 border-[#6ec6ff88] bg-gradient-to-b from-[#0e2447] to-[#0a1630]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <motion.polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#ffe09a"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: "drop-shadow(0 0 4px #ffd36b)" }}
            initial={false}
            animate={{ opacity: 1 }}
          />
        </svg>
        {nodes.map((n, i) => {
          const idx = chain.indexOf(n.t);
          const on = idx >= 0;
          return (
            <motion.button
              key={n.t}
              type="button"
              disabled={disabled}
              onClick={() => toggle(n.t)}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-2 px-3 py-1.5 font-bold"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                borderColor: on ? "#ffe09a" : "#6ec6ff",
                background: on ? "linear-gradient(180deg,#ffe9b0,#e0aa4b)" : "#12306a",
                color: on ? "#2a1a05" : "#fff",
              }}
              animate={{
                y: [0, -4, 0],
                scale: on ? 1.12 : nextHint === n.t ? [1, 1.2, 1] : 1,
                boxShadow: on ? "0 0 18px #ffd36b" : nextHint === n.t ? "0 0 16px #7bd88f" : "0 0 8px #6ec6ff66",
              }}
              transition={{ y: { repeat: Infinity, duration: 2 + i * 0.3 }, scale: { repeat: nextHint === n.t ? Infinity : 0, duration: 0.9 } }}
              lang="en"
            >
              {on && <span className="mr-1 text-xs">{idx + 1}</span>}
              {n.t}
            </motion.button>
          );
        })}
      </div>
      <p className="min-h-7 text-center text-lg font-bold text-[var(--gold)]" lang="en">{sentence || "…"}</p>
      <div className="flex gap-3">
        <button type="button" className="btn btn-ghost flex-1 !py-2" disabled={disabled || !chain.length} onClick={() => setChain([])}>
          Soltar
        </button>
        <button type="button" className="btn btn-gold flex-[2] !py-2" disabled={disabled || !chain.length} onClick={() => onAnswer(igual(sentence, q.correcta), sentence)}>
          🤝 Sellar promesa
        </button>
      </div>
    </div>
  );
}
