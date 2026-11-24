"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Versus } from "@/components/Versus";
import { Fireflies, GoldButton, Modal, Music, SoundToggle, Stars } from "@/components/ui";
import { NIVELES, type Nivel } from "@/data/levels";
import { sfx, speak } from "@/lib/sound";
import { nivelDesbloqueado, rango, useSave } from "@/lib/store";

const POS: Record<number, { left: string; top: string }> = {
  1: { left: "21%", top: "72%" },
  2: { left: "55%", top: "57%" },
  3: { left: "81%", top: "63%" },
  4: { left: "75%", top: "35%" },
};
const ICON: Record<number, string> = { 1: "🌲", 2: "🌉", 3: "🗼", 4: "🏰" };

export default function MapPage() {
  const router = useRouter();
  const { save, ready, pull } = useSave();
  const [lesson, setLesson] = useState<Nivel | null>(null);
  const [versus, setVersus] = useState<Nivel | null>(null);

  useEffect(() => {
    pull();
  }, [pull]);

  const unlocked = nivelDesbloqueado(save.levels);
  const allDone = unlocked > NIVELES.length;
  const totalStars = Object.values(save.levels).reduce((a, l) => a + (l?.stars ?? 0), 0);
  const { actual, siguiente } = rango(save.xp);
  const pct = siguiente ? ((save.xp - actual.min) / (siguiente.min - actual.min)) * 100 : 100;

  const pick = (n: Nivel) => {
    if (n.numero > unlocked) {
      sfx("/audio/boton.mp3", 0.3);
      return;
    }
    sfx("/audio/boton.mp3", 0.6);
    setLesson(n);
  };

  const go = useCallback(() => {
    if (versus) router.push(`/battle/${versus.numero}`);
  }, [router, versus]);

  return (
    <main
      className="relative min-h-dvh overflow-hidden px-4 pb-10 pt-4"
      style={{ background: "radial-gradient(ellipse at top, #1a2b52 0%, #0b1325 70%)" }}
    >
      <Music src="/audio/Mapa.mp3" volume={0.45} />
      <Fireflies count={14} color="#9bd0ff" />

      <motion.div
        className="relative z-10 mx-auto max-w-5xl"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <Link href="/" className="btn btn-ghost !py-2 text-sm">← Inicio</Link>
          <div className="card-glass flex flex-1 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2" style={{ minWidth: 260 }}>
            <div>
              <p className="font-title text-sm font-bold text-[var(--gold)]">
                {ready && save.player ? save.player.name : "Invitado"} · {actual.nombre}
              </p>
              <div className="mt-1 h-2.5 w-40 overflow-hidden rounded-full bg-black/50" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de rango">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#ffe09a] to-[#e0aa4b]"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>
            </div>
            <p className="text-sm">✨ <strong>{save.xp}</strong> XP{siguiente ? ` · próximo: ${siguiente.nombre} (${siguiente.min})` : ""}</p>
            <p className="text-sm">⭐ <strong>{totalStars}</strong> / 12</p>
          </div>
          <SoundToggle />
        </header>

        <h1 className="font-deco mb-1 text-3xl font-black text-[var(--gold)] sm:text-4xl">Mapa del Reino</h1>
        <p className="mb-3 text-[#cdd6ea]">
          {allDone
            ? "🎉 ¡Completaste las cuatro zonas del reino! Repite los duelos para conseguir las 3 estrellas."
            : "Sigue el camino dorado. Toca un marcador para estudiar la lección y entrar en la zona."}
        </p>

        <nav
          aria-label="Zonas del reino"
          className="relative overflow-hidden rounded-2xl border border-[#be9348] bg-[#101c32] shadow-[0_12px_35px_#0009]"
        >
          <img src="/images/mapa-del-reino.svg" alt="" className="block h-auto w-full" style={{ aspectRatio: "1000 / 640" }} />
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,#0b132599_100%)]" />

          {NIVELES.map((n, i) => {
            const stat = save.levels[n.numero];
            const done = (stat?.wins ?? 0) > 0;
            const locked = n.numero > unlocked;
            const current = n.numero === unlocked;
            return (
              <motion.button
                key={n.numero}
                type="button"
                onClick={() => pick(n)}
                aria-label={`${n.nombre}${locked ? " (bloqueada)" : ""}`}
                className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
                style={POS[n.numero]}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.18, type: "spring", damping: 12 }}
                whileHover={locked ? { x: [0, -3, 3, 0] } : { scale: 1.12 }}
                whileTap={{ scale: 0.94 }}
              >
                {current && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ animation: "pulse-ring 1.6s ease-out infinite", ["--ring" as string]: `${n.color}cc` }}
                  />
                )}
                <span
                  className="relative grid h-12 w-12 place-items-center rounded-full border-[3px] text-2xl shadow-[0_6px_14px_#000a] sm:h-16 sm:w-16 sm:text-3xl"
                  style={{
                    borderColor: locked ? "#555d70" : done ? "#ffe09a" : n.color,
                    background: locked ? "#2a3144" : `radial-gradient(circle at 30% 25%, ${n.color}, #1b2744 85%)`,
                    filter: locked ? "grayscale(1)" : undefined,
                    animation: current ? "floaty 2.2s ease-in-out infinite" : undefined,
                  }}
                >
                  {locked ? "🔒" : ICON[n.numero]}
                  {done && (
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#ffe09a] text-sm text-[#3a2407]">✓</span>
                  )}
                </span>
                <span className="font-title absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[var(--gold)] sm:text-xs">
                  {n.numero}. {n.nombre}
                </span>
                {done && (
                  <span className="absolute left-1/2 top-[calc(100%+22px)] -translate-x-1/2">
                    <Stars value={stat?.stars ?? 0} size={14} />
                  </span>
                )}
                {current && (
                  <motion.img
                    src="/images/personajes-mate/caballero/reposo.png"
                    alt=""
                    className="pointer-events-none absolute bottom-[calc(100%-6px)] left-1/2 w-14 -translate-x-1/2 sm:w-20"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Lección rápida antes de pelear */}
      <Modal
        open={!!lesson}
        onClose={() => setLesson(null)}
        title={lesson ? `${ICON[lesson.numero]} ${lesson.nombre}` : ""}
        wide
      >
        {lesson && (
          <div>
            <p className="font-title mb-1 text-sm font-bold tracking-widest text-[#9bd0ff]">LECCIÓN RÁPIDA</p>
            <h3 className="mb-3 text-xl font-extrabold">{lesson.leccion.titulo}</h3>
            <ul className="space-y-2">
              {lesson.leccion.puntos.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2"
                >
                  <button
                    type="button"
                    aria-label={`Escuchar: ${p.en}`}
                    onClick={() => speak(p.en.replace(/[→·]/g, ",").replace(/\(.*?\)/g, ""))}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#be9348]/30 text-lg transition hover:scale-110 hover:bg-[#be9348]/60"
                  >
                    🔊
                  </button>
                  <div>
                    <p className="font-bold text-[var(--gold)]" lang="en">{p.en}</p>
                    <p className="text-sm text-[#cdd6ea]">{p.es}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl border border-[#9bd0ff55] bg-[#9bd0ff14] px-3 py-2 text-sm">💡 {lesson.leccion.consejo}</p>
            <p className="mt-4 text-sm text-[#cdbf9c]">
              Guardián: <strong>{lesson.guardian}</strong> · Vida {lesson.vida} · Debilidad: <strong>{lesson.debilidad}</strong>
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <GoldButton variant="ghost" onClick={() => setLesson(null)}>Volver</GoldButton>
              <GoldButton
                onClick={() => {
                  setVersus(lesson);
                  setLesson(null);
                }}
              >
                ⚔️ ¡A luchar!
              </GoldButton>
            </div>
          </div>
        )}
      </Modal>

      <Versus nivel={versus} onDone={go} />
    </main>
  );
}
