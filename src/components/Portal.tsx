"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { sfx } from "@/lib/sound";

/** Transición de inmersión: un portal dorado se abre y engulle la pantalla. */
export function Portal({ active, onDone }: { active: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!active) return;
    sfx("/audio/combate/solar-transformacion.mp3", 0.35);
    const t = setTimeout(onDone, 2100);
    return () => clearTimeout(t);
  }, [active, onDone]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.8 }}
          />
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: "40vmax",
                height: "40vmax",
                border: `${6 - i}px solid ${i % 2 ? "#ffe09a" : "#e0aa4b"}`,
                boxShadow: "0 0 60px #ffd36b, inset 0 0 60px #ffd36b66",
              }}
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{ scale: [0, 0.4 + i * 0.28, 4.5], rotate: i % 2 ? -260 : 260, opacity: [0, 1, 0.2] }}
              transition={{ duration: 1.9, delay: i * 0.12, ease: "easeInOut" }}
            />
          ))}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "30vmax",
              height: "30vmax",
              background:
                "conic-gradient(from 0deg, #ffe09a, #7a4cff, #6ec6ff, #ffe09a, #ff8a6b, #ffe09a)",
              filter: "blur(18px)",
            }}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1, 6], rotate: 540 }}
            transition={{ duration: 2, ease: "easeIn" }}
          />
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1] }}
            transition={{ duration: 2.1, times: [0, 0.7, 1] }}
          />
          <motion.p
            className="font-title relative text-3xl font-extrabold tracking-[0.3em] text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 1.3] }}
            transition={{ duration: 1.6 }}
          >
            ENTRANDO AL REINO…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
