"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, type ReactNode } from "react";
import { click, playMusic, setSettings, unlockAudio, useSoundSettings } from "@/lib/sound";

/** Arranca una pista de música y desbloquea el audio tras la primera interacción. */
export function Music({ src, volume = 0.5 }: { src: string; volume?: number }) {
  useEffect(() => {
    playMusic(src, volume);
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [src, volume]);
  return null;
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const s = useSoundSettings();
  return (
    <button
      type="button"
      aria-label={s.muted ? "Activar sonido" : "Silenciar"}
      aria-pressed={s.muted}
      onClick={() => setSettings({ muted: !s.muted })}
      className={`btn btn-ghost !px-3 !py-2 text-xl ${className}`}
    >
      {s.muted ? "🔇" : "🔊"}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className={`card-glass max-h-[88dvh] w-full overflow-y-auto p-6 ${wide ? "max-w-2xl" : "max-w-lg"}`}
          >
            <h2 className="font-title mb-4 text-2xl font-extrabold text-[var(--gold)]">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Luciérnagas decorativas (valores deterministas para evitar diferencias servidor/cliente). */
export function Fireflies({ count = 22, color = "#ffe9a0" }: { count?: number; color?: string }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 37 + 11) % 100,
        top: 25 + ((i * 53) % 70),
        dx: ((i * 29) % 120) - 60,
        dy: -40 - ((i * 17) % 90),
        dur: 6 + ((i * 7) % 8),
        delay: -((i * 13) % 10),
        size: 3 + (i % 4),
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((f, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            background: color,
            boxShadow: `0 0 ${f.size * 3}px ${f.size}px ${color}88`,
            animation: `firefly ${f.dur}s ease-in-out ${f.delay}s infinite`,
            ["--dx" as string]: `${f.dx}px`,
            ["--dy" as string]: `${f.dy}px`,
          }}
        />
      ))}
    </div>
  );
}

export function Stars({ value, size = 22 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} de 3 estrellas`}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{ fontSize: size, filter: i <= value ? "drop-shadow(0 0 6px #ffd36b)" : "grayscale(1) opacity(.35)" }}
        >
          ⭐
        </span>
      ))}
    </span>
  );
}

export function GoldButton({
  children,
  onClick,
  variant = "gold",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "gold" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={() => {
        click();
        onClick?.();
      }}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}
