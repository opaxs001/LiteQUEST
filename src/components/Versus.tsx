"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { Nivel } from "@/data/levels";
import { sfx } from "@/lib/sound";

/** Pantalla cinemática «VS» antes del combate. */
export function Versus({ nivel, onDone }: { nivel: Nivel | null; onDone: () => void }) {
  useEffect(() => {
    if (!nivel) return;
    sfx(`/audio/combate/jefe-${nivel.numero}-grito.mp3`, 0.7);
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [nivel, onDone]);

  return (
    <AnimatePresence>
      {nivel && (
        <motion.div
          key="versus"
          className="fixed inset-0 z-[100] overflow-hidden bg-black"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/images/transiciones/fondo-versus.jpg)" }}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3.2, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b3b7a66] via-transparent to-[#8a1a1a77]" />

          {/* Héroe */}
          <motion.div
            className="absolute bottom-0 left-0 w-[52%] max-w-[560px]"
            initial={{ x: "-110%" }}
            animate={{ x: 0 }}
            transition={{ delay: 0.45, type: "spring", damping: 16, stiffness: 90 }}
          >
            <img src="/images/personajes-mate/caballero/impacto-hachazo.png" alt="" draggable={false}
              className="w-full" style={{ filter: "drop-shadow(0 0 28px #6ec6ffaa)" }} />
          </motion.div>
          {/* Guardián */}
          <motion.div
            className="absolute bottom-0 right-0 w-[56%] max-w-[620px]"
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            transition={{ delay: 0.65, type: "spring", damping: 16, stiffness: 90 }}
          >
            <img src={`${nivel.arte}/preparacion.png`} alt="" draggable={false}
              className="w-full" style={{ filter: "drop-shadow(0 0 28px #ff4b3acc)" }} />
          </motion.div>

          {/* Cintas */}
          <motion.div
            className="absolute left-[2%] top-[14%] w-[44%] max-w-[480px]"
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.0, type: "spring", damping: 18 }}
          >
            <div className="relative">
              <img src="/images/transiciones/cinta-nombre.png" alt="" className="w-full [mix-blend-mode:screen]" />
              <span className="font-title absolute inset-0 flex items-center justify-center px-[12%] text-center text-lg font-extrabold text-[#3a2407] sm:text-2xl">
                Caballero del Sol
              </span>
            </div>
          </motion.div>
          <motion.div
            className="absolute right-[2%] top-[14%] w-[44%] max-w-[480px]"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.15, type: "spring", damping: 18 }}
          >
            <div className="relative">
              <img src="/images/transiciones/cinta-nombre.png" alt="" className="w-full [mix-blend-mode:screen]" />
              <span className="font-title absolute inset-0 flex items-center justify-center px-[12%] text-center text-base font-extrabold leading-tight text-[#5a1010] sm:text-2xl">
                {nivel.guardian}
              </span>
            </div>
          </motion.div>

          {/* Emblema VS */}
          <motion.img
            src="/images/transiciones/emblema-vs.png"
            alt="VS"
            className="absolute left-1/2 top-1/2 w-[34vw] max-w-[380px] -translate-x-1/2 -translate-y-1/2 [mix-blend-mode:screen]"
            initial={{ scale: 4, opacity: 0, rotate: -12 }}
            animate={{ scale: [4, 0.85, 1], opacity: 1, rotate: 0 }}
            transition={{ delay: 1.3, duration: 0.7, times: [0, 0.6, 1] }}
          />
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ delay: 1.45, duration: 0.5 }}
          />

          <motion.div
            className="absolute inset-x-0 bottom-[8%] text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9 }}
          >
            <p className="font-deco text-2xl font-black text-[var(--gold)] drop-shadow-[0_3px_0_#000] sm:text-4xl">
              {nivel.nombre}
            </p>
            <p className="font-title mt-1 tracking-[0.3em] text-white/90">{nivel.tema.toUpperCase()}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
