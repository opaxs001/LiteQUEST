"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Q } from "@/data/levels";
import { click } from "@/lib/sound";
import { igual } from "@/lib/text";

type SQ = Extract<Q, { tipo: "hechizo" }>;

/** «Rompe el hechizo»: coloca la palabra rúnica en el hueco correcto de la frase. */
export function SpellQ({
  q,
  hint,
  disabled,
  onAnswer,
}: {
  q: SQ;
  hint: boolean;
  disabled: boolean;
  onAnswer: (ok: boolean, text: string) => void;
}) {
  const [gap, setGap] = useState<number | null>(null);
  const build = (g: number) => [...q.frase.slice(0, g), q.insertar, ...q.frase.slice(g)].join(" ");

  return (
    <div className="space-y-4">
      <p className="font-bold" lang="en">{q.texto}</p>
      <div className="relative overflow-hidden rounded-xl border-2 border-[#a07aff] bg-gradient-to-b from-[#2a1650] to-[#150b2c] p-4">
        <motion.div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#a07aff55] blur-2xl"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
        />
        <div className="relative flex flex-wrap items-center gap-1.5 text-xl font-bold" lang="en">
          {q.frase.map((w, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <motion.button
                  type="button"
                  aria-label={`Colocar ${q.insertar} antes de ${w}`}
                  disabled={disabled}
                  onClick={() => {
                    click();
                    setGap(gap === i ? null : i);
                  }}
                  className="grid place-items-center rounded-md border-2 border-dashed font-black"
                  animate={{
                    width: gap === i ? 62 : 22,
                    height: 34,
                    borderColor: gap === i ? "#ffe09a" : hint && i === q.posicion ? "#7bd88f" : "#a07aff",
                    backgroundColor: gap === i ? "#e0aa4b" : "#a07aff22",
                    color: "#2a1a05",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                >
                  {gap === i ? <span className="text-sm uppercase">{q.insertar}</span> : <span className="text-[#c9b4ff]">+</span>}
                </motion.button>
              )}
              <span className="rounded-md bg-white/10 px-2 py-0.5">{w}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-[#9aa7c7]">Toca un hueco «+» para colocar la runa «{q.insertar}».</p>
      <button
        type="button"
        className="btn btn-gold w-full !py-2"
        disabled={disabled || gap === null}
        onClick={() => gap !== null && onAnswer(igual(build(gap), q.correcta), build(gap))}
      >
        ✨ Lanzar contrahechizo
      </button>
    </div>
  );
}
