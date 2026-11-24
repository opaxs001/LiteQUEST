"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import type { Q } from "@/data/levels";
import { click } from "@/lib/sound";
import { shuffle } from "@/lib/text";

type CQ = Extract<Q, { tipo: "clasificar" }>;
type Dest = "heroe" | "monstruo";

/** Arrastra cada palabra al héroe (futuro) o al monstruo (pasado). También funciona tocando. */
export function ClassifyQ({
  q,
  hint,
  disabled,
  onHit,
  onMiss,
  onComplete,
}: {
  q: CQ;
  hint: boolean;
  disabled: boolean;
  onHit: (dest: Dest) => void;
  onMiss: (dest: Dest) => void;
  onComplete: () => void;
}) {
  const words = useMemo(() => shuffle(q.palabras), [q]);
  const [done, setDone] = useState<string[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [over, setOver] = useState<Dest | null>(null);
  const [wrong, setWrong] = useState<Dest | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const monRef = useRef<HTMLDivElement>(null);

  const hit = (p: { x: number; y: number }): Dest | null => {
    for (const [d, r] of [["heroe", heroRef], ["monstruo", monRef]] as const) {
      const b = r.current?.getBoundingClientRect();
      if (b && p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom) return d;
    }
    return null;
  };

  const drop = (texto: string, dest: Dest) => {
    if (disabled) return;
    const w = q.palabras.find((p) => p.texto === texto)!;
    const ok = w.futuro === (dest === "heroe");
    setSel(null);
    if (ok) {
      const nd = [...done, texto];
      setDone(nd);
      onHit(dest);
      if (nd.length === q.palabras.length) onComplete();
    } else {
      setWrong(dest);
      setTimeout(() => setWrong(null), 500);
      onMiss(dest);
    }
  };

  const hintWord = hint ? words.find((w) => !done.includes(w.texto)) : undefined;

  const zone = ({ dest, refEl, emoji, label, sub, src }: { dest: Dest; refEl: React.RefObject<HTMLDivElement | null>; emoji: string; label: string; sub: string; src: string }) => (
    <motion.div
      ref={refEl}
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${sub}`}
      onClick={() => sel && drop(sel, dest)}
      onKeyDown={(e) => e.key === "Enter" && sel && drop(sel, dest)}
      animate={{
        scale: over === dest ? 1.06 : 1,
        x: wrong === dest ? [0, -8, 8, -5, 0] : 0,
        borderColor: wrong === dest ? "#ff6a5a" : over === dest || (sel && true) ? "#ffe09a" : "#5b6f9f",
      }}
      className="relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border-2 bg-black/30 p-2 text-center"
    >
      <div className="h-16 w-full overflow-hidden">
        <img src={src} alt="" draggable={false} className="mx-auto h-24 object-contain object-top" />
      </div>
      <p className="font-title text-sm font-extrabold">{emoji} {label}</p>
      <p className="text-xs text-[#9aa7c7]">{sub}</p>
      <AnimatePresence>
        {over === dest && (
          <motion.span className="absolute inset-0 bg-[#ffe09a33]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="space-y-3">
      <p className="font-bold" lang="en">{q.texto}</p>
      <div className="grid grid-cols-2 gap-3">
        {zone({ dest: "heroe", refEl: heroRef, emoji: "🛡️", label: "Héroe", sub: "Futuro", src: "/images/personajes-mate/caballero/reposo.png" })}
        {zone({ dest: "monstruo", refEl: monRef, emoji: "👹", label: "Monstruo", sub: "Pasado", src: "/images/personajes-mate/grifo/reposo.png" })}
      </div>

      <div className="flex min-h-[110px] flex-wrap items-center justify-center gap-2.5 rounded-xl bg-black/20 p-3" aria-label="Palabras">
        <AnimatePresence>
          {words
            .filter((w) => !done.includes(w.texto))
            .map((w) => (
              <motion.button
                key={w.texto}
                type="button"
                drag={!disabled}
                dragSnapToOrigin
                dragElastic={0.6}
                whileDrag={{ scale: 1.2, rotate: -4, zIndex: 50, cursor: "grabbing" }}
                onDragStart={() => setDragging(w.texto)}
                onDrag={(_, info) => setOver(hit(info.point))}
                onDragEnd={(_, info) => {
                  const d = hit(info.point);
                  setOver(null);
                  setDragging(null);
                  if (d) drop(w.texto, d);
                }}
                onClick={() => {
                  if (disabled) return;
                  click();
                  setSel(sel === w.texto ? null : w.texto);
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: sel === w.texto ? 1.12 : 1,
                  opacity: 1,
                  boxShadow: hintWord?.texto === w.texto ? "0 0 18px #7bd88f" : sel === w.texto ? "0 0 18px #ffe09a" : "0 4px 0 #111a30",
                }}
                exit={{ scale: 0, opacity: 0, y: -30 }}
                className="touch-none rounded-lg border-2 px-4 py-2 text-lg font-bold"
                style={{
                  cursor: "grab",
                  borderColor: sel === w.texto ? "var(--gold)" : "#5b6f9f",
                  background: sel === w.texto ? "#4a3a12" : "#26365e",
                  zIndex: dragging === w.texto ? 50 : 1,
                }}
                lang="en"
              >
                {w.texto}
              </motion.button>
            ))}
        </AnimatePresence>
        {done.length === q.palabras.length && <p className="font-bold text-[#7bd88f]">¡Todas clasificadas!</p>}
      </div>
      <p className="text-center text-xs text-[#9aa7c7]">
        Arrastra cada palabra (o tócala y luego toca al personaje) · {done.length}/{q.palabras.length}
      </p>
    </div>
  );
}
