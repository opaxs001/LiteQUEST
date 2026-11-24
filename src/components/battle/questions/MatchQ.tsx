"use client";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Q } from "@/data/levels";
import { click, sfx } from "@/lib/sound";
import { shuffleDistinct } from "@/lib/text";

type MQ = Extract<Q, { tipo: "parejas" }>;

export function MatchQ({
  q,
  hint,
  disabled,
  onAnswer,
}: {
  q: MQ;
  hint: boolean;
  disabled: boolean;
  onAnswer: (ok: boolean, text: string) => void;
}) {
  const left = useMemo(() => shuffleDistinct(q.pares.map((p) => p.en)), [q]);
  const right = useMemo(() => shuffleDistinct(q.pares.map((p) => p.es)), [q]);
  const [selL, setSelL] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [bad, setBad] = useState<{ l: string; r: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const hintEn = hint ? q.pares.find((p) => !done.includes(p.en))?.en : undefined;

  const tryMatch = (l: string, r: string) => {
    const ok = q.pares.find((p) => p.en === l)?.es === r;
    if (ok) {
      sfx("/audio/combate/escudo.mp3", 0.35);
      const nd = [...done, l];
      setDone(nd);
      setSelL(null);
      if (nd.length === q.pares.length) {
        const m = mistakes;
        setTimeout(() => onAnswer(m <= 2, `${q.pares.length} parejas · ${m} errores`), 450);
      }
    } else {
      setMistakes((m) => m + 1);
      setBad({ l, r });
      setSelL(null);
      setTimeout(() => setBad(null), 450);
    }
  };

  const doneEs = done.map((d) => q.pares.find((p) => p.en === d)!.es);

  return (
    <div className="space-y-3">
      <p className="font-bold" lang="en">{q.texto}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((l) => {
            const isDone = done.includes(l);
            return (
              <motion.button
                key={l}
                type="button"
                disabled={disabled || isDone}
                onClick={() => {
                  click();
                  setSelL(l);
                }}
                animate={{
                  scale: selL === l ? 1.06 : 1,
                  opacity: isDone ? 0.35 : 1,
                  x: bad?.l === l ? [0, -6, 6, -4, 0] : 0,
                  boxShadow: hintEn === l ? "0 0 18px #ffe09a" : "0 0 0 #0000",
                }}
                className="rounded-xl border-2 px-3 py-3 font-bold"
                style={{
                  borderColor: isDone ? "#7bd88f" : selL === l ? "var(--gold)" : bad?.l === l ? "#ff6a5a" : "#5b6f9f",
                  background: isDone ? "#1f6b3a" : selL === l ? "#4a3a12" : "#1d2b4f",
                }}
                lang="en"
              >
                {l}
              </motion.button>
            );
          })}
        </div>
        <div className="grid gap-2">
          {right.map((r) => {
            const isDone = doneEs.includes(r);
            return (
              <motion.button
                key={r}
                type="button"
                disabled={disabled || isDone || !selL}
                onClick={() => selL && tryMatch(selL, r)}
                animate={{
                  opacity: isDone ? 0.35 : selL ? 1 : 0.8,
                  x: bad?.r === r ? [0, 6, -6, 4, 0] : 0,
                }}
                whileHover={selL && !isDone ? { scale: 1.05 } : undefined}
                className="rounded-xl border-2 px-3 py-3 font-bold"
                style={{
                  borderColor: isDone ? "#7bd88f" : bad?.r === r ? "#ff6a5a" : "#5b6f9f",
                  background: isDone ? "#1f6b3a" : "#26365e",
                }}
              >
                {r}
              </motion.button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-[#9aa7c7]">
        Elige una palabra en inglés y luego su significado · Errores: {mistakes}/2 permitidos
      </p>
    </div>
  );
}
