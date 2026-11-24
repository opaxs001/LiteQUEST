"use client";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";
import type { Nivel } from "@/data/levels";

export type Fx = { id: number; src: string; place: "full" | "boss" | "knight" };
export type Float = { id: number; text: string; side: "boss" | "knight"; kind: "dano" | "cura" | "esquiva" | "error" | "info" };

export type SceneState = {
  knightPose: string;
  bossPose: string;
  knightX: number;
  bossX: number;
  knightOffset: number;
  fx: Fx[];
  floats: Float[];
  shake: number;
  flash: "hit" | "heal" | "final" | null;
  flashId: number;
  charge: number;
  shield: boolean;
  bossDown: boolean;
  knightDown: boolean;
  banner: string | null;
  zoom: boolean;
};

export const KNIGHT_POSES = [
  "reposo", "retroceso", "dolor", "tambaleo", "recuperacion", "caida",
  "preparacion-hachazo", "impacto-hachazo", "salida-hachazo",
  "preparacion-barrido", "impacto-barrido", "salida-barrido",
  "preparacion-escudo", "impacto-escudo", "salida-escudo",
  "preparacion-rayo", "impacto-rayo", "salida-magia",
  "preparacion-fenix", "impacto-fenix",
];
export const BOSS_POSES = ["reposo", "preparacion", "impacto", "retroceso", "dolor", "tambaleo", "recuperacion", "caida"];

/** Precarga todas las poses para que el cambio de postura sea instantáneo. */
export function usePreloadPoses(nivel: Nivel) {
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    KNIGHT_POSES.forEach((p) => {
      const i = new Image();
      i.src = `/images/personajes-mate/caballero/${p}.png`;
      imgs.push(i);
    });
    BOSS_POSES.forEach((p) => {
      const i = new Image();
      i.src = `${nivel.arte}/${p}.png`;
      imgs.push(i);
    });
    [nivel.efecto, "/images/magia/rayo.svg", "/images/magia/fenix.svg", "/images/caballero/escudo.svg", "/images/caballero/barrido.svg", "/images/bosque-del-alba/hachazo.svg"].forEach((s) => {
      const i = new Image();
      i.src = s;
      imgs.push(i);
    });
    return () => {
      imgs.length = 0;
    };
  }, [nivel]);
}

const FX_BOX: Record<Fx["place"], string> = {
  full: "inset-0 h-full w-full object-cover",
  boss: "right-[4%] top-[8%] w-[44%]",
  knight: "left-[2%] top-[12%] w-[44%]",
};

function Bar({ value, max, color, label, align }: { value: number; max: number; color: string; label: string; align: "left" | "right" }) {
  const pct = Math.max(0, (value / max) * 100);
  const low = pct <= 30;
  return (
    <div className="min-w-0 flex-1" style={{ textAlign: align }}>
      <p className="mb-0.5 flex items-baseline justify-between gap-2 text-[11px] font-bold drop-shadow-[0_1px_2px_#000] sm:text-sm" style={{ flexDirection: align === "right" ? "row-reverse" : "row" }}>
        <span className="font-title truncate">{label}</span>
        <span className="tabular-nums">{Math.max(0, Math.round(value))}/{max}</span>
      </p>
      <div
        className="relative h-3.5 overflow-hidden rounded-full border-2 border-[#1b1308] bg-black/70 sm:h-4"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div className="absolute inset-y-0 bg-white/80" style={{ [align]: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: 0.5 }} />
        <motion.div
          className="absolute inset-y-0"
          style={{ [align]: 0, background: low ? "linear-gradient(90deg,#ff6a3a,#ff2d2d)" : color, animation: low ? "charge-glow 1s infinite" : undefined }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />
        <span className="absolute inset-x-0 top-0 h-1/2 bg-white/20" />
      </div>
    </div>
  );
}

export function Scene({
  nivel,
  s,
  hpK,
  hpB,
  streak,
}: {
  nivel: Nivel;
  s: SceneState;
  hpK: number;
  hpB: number;
  streak: number;
}) {
  const urgent = s.charge > 0.7 && !s.knightDown;
  const ctrl = useAnimationControls();
  useEffect(() => {
    if (s.shake) void ctrl.start({ x: [0, -9, 8, -6, 5, -2, 0], y: [0, 4, -5, 3, -2, 1, 0], transition: { duration: 0.45 } });
  }, [s.shake, ctrl]);
  return (
    <motion.div
      animate={ctrl}
      className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border-2 border-[#be9348] bg-[#0b1325] shadow-[0_14px_40px_#000b]"
    >
      <motion.div className="absolute inset-0" animate={{ scale: s.zoom ? 1.18 : 1, x: s.zoom ? "-4%" : 0 }} transition={{ duration: 1.2, ease: "easeInOut" }}>
        <img src={nivel.fondo} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />

        {/* Caballero */}
        <motion.div
          className="absolute bottom-[-4%] left-[3%] w-[38%]"
          animate={{ x: `${s.knightX + s.knightOffset}%`, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 17 }}
          role="img"
          aria-label="Caballero con hacha y escudo solar"
        >
          <motion.img
            src={`/images/personajes-mate/caballero/${s.knightPose}.png`}
            alt=""
            draggable={false}
            className="block w-full select-none"
            style={{
              transformOrigin: "50% 95%",
              animation: s.knightPose === "reposo" ? "breathe 3.2s ease-in-out infinite" : undefined,
              filter: s.shield
                ? "drop-shadow(0 0 14px #6ec6ff) drop-shadow(0 10px 8px #0009)"
                : "drop-shadow(0 10px 8px #0009)",
            }}
            animate={{ rotate: s.knightDown ? 0 : 0 }}
          />
          {s.shield && (
            <motion.span
              className="absolute left-[10%] top-[28%] text-3xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 8, -8, 0] }}
              transition={{ rotate: { repeat: Infinity, duration: 2 } }}
              aria-label="Escudo preparado"
            >
              🛡️
            </motion.span>
          )}
          <AnimatePresence>
            {s.floats.filter((f) => f.side === "knight").map((f) => (
              <FloatText key={f.id} f={f} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Guardián */}
        <motion.div
          className="absolute bottom-[-4%] right-[0%] w-[42%]"
          animate={{ x: `${s.bossX}%`, opacity: s.bossDown ? 0.0 : 1, y: s.bossDown ? 30 : 0 }}
          transition={{
            x: { type: "spring", stiffness: 170, damping: 16 },
            opacity: { duration: s.bossDown ? 1.6 : 0.2, delay: s.bossDown ? 0.8 : 0 },
            y: { duration: 1.6 },
          }}
          role="img"
          aria-label={nivel.guardian}
        >
          <img
            src={`${nivel.arte}/${s.bossPose}.png`}
            alt=""
            draggable={false}
            className="block w-full select-none"
            style={{
              transformOrigin: "50% 95%",
              animation:
                s.bossPose === "reposo"
                  ? "breathe 3.8s ease-in-out infinite"
                  : s.charge > 0.6 && s.bossPose === "preparacion"
                    ? "charge-glow 0.7s infinite"
                    : undefined,
              filter: `drop-shadow(0 10px 8px #0009) ${s.charge > 0.4 ? `drop-shadow(0 0 ${6 + s.charge * 18}px rgba(255,70,50,${s.charge * 0.9}))` : ""}`,
            }}
          />
          <AnimatePresence>
            {s.floats.filter((f) => f.side === "boss").map((f) => (
              <FloatText key={f.id} f={f} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Efectos */}
        {s.fx.map((f) => (
          <img
            key={f.id}
            src={f.src}
            alt=""
            draggable={false}
            className={`pointer-events-none absolute ${FX_BOX[f.place]}`}
            style={{ animation: "fx-flash 0.85s ease-out both", mixBlendMode: "screen" }}
          />
        ))}
      </motion.div>

      {/* Destellos de pantalla */}
      <AnimatePresence>
        {s.flash && (
          <motion.div
            key={s.flashId}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                s.flash === "hit"
                  ? "radial-gradient(circle, transparent 30%, #ff2d2daa 100%)"
                  : s.flash === "heal"
                    ? "radial-gradient(circle, #7bd88f55, transparent 70%)"
                    : "radial-gradient(circle, #fff, #ffd36b66)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: s.flash === "final" ? 1.1 : 0.55 }}
          />
        )}
      </AnimatePresence>
      {urgent && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: "inset 0 0 90px 10px #ff2d2d88", animation: "danger-vignette 0.8s infinite" }}
        />
      )}

      {/* HUD */}
      <div className="absolute inset-x-0 top-0 flex items-start gap-4 bg-gradient-to-b from-black/70 to-transparent px-3 pb-6 pt-2 sm:px-4">
        <Bar value={hpK} max={100} color="linear-gradient(90deg,#5fd37a,#2f9e4f)" label="Caballero" align="left" />
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#be9348] bg-[#1b2744] text-xs font-black text-[var(--gold)]">VS</div>
        <Bar value={hpB} max={nivel.vida} color="linear-gradient(90deg,#ff8a6b,#d93a3a)" label={nivel.guardian} align="right" />
      </div>

      <AnimatePresence>
        {streak >= 2 && (
          <motion.div
            key={streak}
            className="font-title absolute left-3 top-14 rounded-full border border-[#ffd36b] bg-[#2a1a05cc] px-3 py-1 text-xs font-extrabold text-[#ffe09a] sm:text-sm"
            initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
          >
            🔥 Racha ×{streak}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {s.banner && (
          <motion.div
            key={s.banner}
            className="pointer-events-none absolute inset-x-0 top-[38%] text-center"
            initial={{ scale: 2.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 14 }}
          >
            <span className="font-deco bg-gradient-to-b from-white via-[#ffe09a] to-[#e0aa4b] bg-clip-text text-3xl font-black text-transparent drop-shadow-[0_4px_0_#4a2a05] sm:text-5xl" style={{ filter: "drop-shadow(0 0 18px #ffb84a)" }}>
              {s.banner}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FloatText({ f }: { f: Float }) {
  const color =
    f.kind === "dano" ? "#ff6a5a" : f.kind === "cura" ? "#7bd88f" : f.kind === "esquiva" ? "#9bd0ff" : f.kind === "error" ? "#ffb74a" : "#fff";
  return (
    <motion.span
      className="font-title pointer-events-none absolute left-1/2 top-[18%] z-20 whitespace-nowrap text-2xl font-black sm:text-4xl"
      style={{ color, textShadow: "0 3px 0 #000, 0 0 14px #000" }}
      initial={{ y: 0, opacity: 0, scale: 0.5, x: "-50%" }}
      animate={{ y: -70, opacity: [0, 1, 1, 0], scale: [0.5, 1.4, 1, 1] }}
      transition={{ duration: 1.5, times: [0, 0.15, 0.7, 1] }}
    >
      {f.text}
    </motion.span>
  );
}
