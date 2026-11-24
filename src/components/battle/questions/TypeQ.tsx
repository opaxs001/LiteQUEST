"use client";
import { useState } from "react";
import type { Q } from "@/data/levels";
import { igual } from "@/lib/text";

type TQ = Extract<Q, { tipo: "escribir" }>;

export function TypeQ({
  q,
  hint,
  disabled,
  onAnswer,
}: {
  q: TQ;
  hint: boolean;
  disabled: boolean;
  onAnswer: (ok: boolean, text: string) => void;
}) {
  const [v, setV] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !v.trim()) return;
    onAnswer([q.correcta, ...(q.alternativas ?? [])].some((c) => igual(c, v)), v.trim());
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="font-bold" lang="en">{q.texto}</p>
      <p className="flex flex-wrap items-center gap-2 rounded-xl bg-black/30 p-3 text-lg font-bold" lang="en">
        <span>{q.antes}</span>
        <input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="Escribe la palabra que falta"
          placeholder={hint ? `${q.correcta[0]}…` : "…"}
          className="w-32 rounded-lg border-2 border-[var(--gold)] bg-[#0b1325] px-3 py-1.5 text-center text-[var(--gold)] outline-none focus:shadow-[0_0_14px_#ffd36b88]"
        />
        <span>{q.despues}</span>
      </p>
      <button type="submit" className="btn btn-gold w-full !py-2" disabled={disabled || !v.trim()}>
        Comprobar ⏎
      </button>
    </form>
  );
}
