"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sound";

const LANES = [24, 52, 80];

/** Corta las 3 bolas de energía antes de que lleguen al caballero (desliza, arrastra o toca). */
export function AxeQ({
  texto,
  progress,
  disabled,
  onSuccess,
}: {
  texto: string;
  progress: number; // 0..1 (tiempo consumido)
  disabled: boolean;
  onSuccess: () => void;
}) {
  const [cut, setCut] = useState<number[]>([]);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const orbs = useRef<(HTMLButtonElement | null)[]>([]);
  const drawing = useRef(false);

  const doCut = (i: number) => {
    if (disabled) return;
    setCut((c) => {
      if (c.includes(i)) return c;
      sfx("/audio/combate/hachazo.mp3", 0.35);
      return [...c, i];
    });
  };

  useEffect(() => {
    if (cut.length === 3) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut.length]);

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || disabled) return;
    const b = box.current?.getBoundingClientRect();
    if (!b) return;
    setTrail((t) => [...t.slice(-14), { x: e.clientX - b.left, y: e.clientY - b.top }]);
    orbs.current.forEach((el, i) => {
      if (!el || cut.includes(i)) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < r.width * 0.75) doCut(i);
    });
  };

  return (
    <div className="space-y-3">
      <p className="font-bold" lang="en">{texto}</p>
      <div
        ref={box}
        className="relative h-52 touch-none select-none overflow-hidden rounded-xl border-2 border-[#ff6a5a88] bg-gradient-to-r from-[#0e1a33] to-[#3a1010] cursor-crosshair"
        onPointerDown={(e) => {
          drawing.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          drawing.current = false;
          setTimeout(() => setTrail([]), 150);
        }}
        onPointerCancel={() => {
          drawing.current = false;
          setTrail([]);
        }}
      >
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl opacity-80" aria-hidden>🛡️</span>
        <div className="absolute bottom-0 left-9 top-0 w-0.5 bg-[#7bd88f] opacity-50" aria-hidden />
        {LANES.map((y, i) => {
          const p = Math.min(1, Math.max(0, (progress - i * 0.06) / 0.82));
          const x = 94 - p * 80;
          const isCut = cut.includes(i);
          return (
            <AnimatePresence key={i}>
              {!isCut && (
                <motion.button
                  ref={(el) => {
                    orbs.current[i] = el;
                  }}
                  type="button"
                  aria-label={`Bola de energía ${i + 1}`}
                  disabled={disabled}
                  onClick={() => doCut(i)}
                  className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transition: "left 110ms linear",
                    background: "radial-gradient(circle at 35% 30%, #fff, #ffb84a 35%, #ff3d2d 75%, #7a0d0d)",
                    boxShadow: `0 0 ${14 + p * 22}px ${4 + p * 6}px #ff4b3a99`,
                  }}
                  exit={{ scale: [1, 1.6, 0], opacity: [1, 1, 0] }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          );
        })}
        {cut.map((i) => (
          <motion.span
            key={`c${i}`}
            className="pointer-events-none absolute text-4xl"
            style={{ left: "50%", top: `${LANES[i] - 8}%` }}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            ✨
          </motion.span>
        ))}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <polyline
            points={trail.map((t) => `${t.x},${t.y}`).join(" ")}
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 6px #9bd0ff)" }}
          />
        </svg>
        <p className="pointer-events-none absolute bottom-1 right-2 text-xs text-white/70">
          🪓 {cut.length}/3 · desliza sobre las bolas
        </p>
      </div>
    </div>
  );
}
