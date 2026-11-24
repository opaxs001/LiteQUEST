"use client";
import { LayoutGroup, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Q } from "@/data/levels";
import { click } from "@/lib/sound";
import { igual, shuffleDistinct } from "@/lib/text";

type OQ = Extract<Q, { tipo: "ordenar" }>;

export function middle(q: OQ) {
  let s = q.correcta;
  if (q.antes && s.startsWith(q.antes)) s = s.slice(q.antes.length).trim();
  if (q.despues) {
    const d = q.despues.trim();
    if (d && s.endsWith(d)) s = s.slice(0, s.length - d.length).trim();
  }
  return s;
}

const tidy = (w: string) => {
  const t = w.replace(/[.,!?]+$/, "");
  return t === "I" ? t : t.toLowerCase();
};

export function OrderQ({
  q,
  hint,
  disabled,
  onAnswer,
}: {
  q: OQ;
  hint: boolean;
  disabled: boolean;
  onAnswer: (ok: boolean, text: string) => void;
}) {
  const expected = useMemo(() => middle(q).split(/\s+/).map(tidy), [q]);
  const bank0 = useMemo(
    () => shuffleDistinct([...expected, ...(q.extras ?? [])].map((t, i) => ({ id: i, t }))),
    [expected, q.extras],
  );
  const [placed, setPlaced] = useState<{ id: number; t: string }[]>([]);
  const placedIds = new Set(placed.map((p) => p.id));
  const bank = bank0.filter((b) => !placedIds.has(b.id));

  const build = () => `${q.antes ?? ""} ${placed.map((p) => p.t).join(" ")} ${q.despues ?? ""}`.trim();
  const submit = () => {
    if (disabled || placed.length === 0) return;
    onAnswer(igual(build(), q.correcta), build());
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
      if (e.key === "Backspace") setPlaced((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // Pista: marca el siguiente movimiento correcto
  let wrongIdx = -1;
  for (let i = 0; i < placed.length; i++) if (placed[i].t !== expected[i]) { wrongIdx = i; break; }
  const nextWord = wrongIdx === -1 ? expected[placed.length] : null;
  const hintBank = hint && nextWord ? bank.find((b) => b.t === nextWord)?.id : undefined;

  const add = (b: { id: number; t: string }) => {
    if (disabled) return;
    click();
    setPlaced((p) => [...p, b]);
  };
  const remove = (id: number) => {
    if (disabled) return;
    click();
    setPlaced((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-4">
      {q.contexto && <p className="rounded-lg bg-white/5 px-3 py-2 text-sm italic text-[#cdd6ea]">{q.contexto}</p>}
      <p className="font-bold" lang="en">{q.texto}</p>

      <LayoutGroup>
        <div className="flex min-h-[64px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-[#be9348]/70 bg-black/30 p-3" aria-label="Tu frase">
          {q.antes && <span className="font-bold text-[#9bd0ff]" lang="en">{q.antes}</span>}
          {placed.map((p, i) => (
            <motion.button
              key={p.id}
              layoutId={`tok-${p.id}`}
              type="button"
              onClick={() => remove(p.id)}
              className="rounded-lg border-2 px-3 py-1.5 font-bold text-[#2a1a05]"
              style={{
                background: hint && wrongIdx === i ? "#ff9a8a" : "linear-gradient(180deg,#ffe9b0,#e0aa4b)",
                borderColor: hint && wrongIdx === i ? "#ff3d2d" : "#fff3cf",
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              lang="en"
            >
              {p.t}
            </motion.button>
          ))}
          {placed.length === 0 && <span className="text-sm text-[#8a95b3]">Toca las fichas para construir la frase…</span>}
          {q.despues && <span className="font-bold text-[#9bd0ff]" lang="en">{q.despues}</span>}
        </div>

        <div className="flex flex-wrap justify-center gap-2" aria-label="Fichas disponibles">
          {bank.map((b) => (
            <motion.button
              key={b.id}
              layoutId={`tok-${b.id}`}
              type="button"
              onClick={() => add(b)}
              className="rounded-lg border-2 border-[#5b6f9f] bg-[#26365e] px-3 py-1.5 font-bold text-white shadow-[0_4px_0_#111a30] hover:border-[var(--gold)]"
              animate={hintBank === b.id ? { scale: [1, 1.18, 1], boxShadow: "0 0 18px #ffe09a" } : { scale: 1 }}
              transition={hintBank === b.id ? { repeat: Infinity, duration: 0.9 } : { type: "spring", stiffness: 420, damping: 30 }}
              whileTap={{ scale: 0.9 }}
              lang="en"
            >
              {b.t}
            </motion.button>
          ))}
        </div>
      </LayoutGroup>

      <div className="flex gap-3">
        <button type="button" className="btn btn-ghost flex-1 !py-2" onClick={() => setPlaced([])} disabled={disabled || !placed.length}>
          Borrar
        </button>
        <button type="button" className="btn btn-gold flex-[2] !py-2" onClick={submit} disabled={disabled || !placed.length}>
          Comprobar ⏎
        </button>
      </div>
    </div>
  );
}
