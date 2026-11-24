"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import type { Q } from "@/data/levels";

type DQ = Extract<Q, { tipo: "esquivar" }>;

export function DodgeQ({
  q,
  hint,
  disabled,
  onDodge,
  onPreview,
}: {
  q: DQ;
  hint: boolean;
  disabled: boolean;
  onDodge: (lado: "izquierda" | "derecha") => void;
  onPreview: (lado: "izquierda" | "derecha" | null) => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "ArrowLeft" || e.key === "a") onDodge("izquierda");
      if (e.key === "ArrowRight" || e.key === "d") onDodge("derecha");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const safe = q.lado === "izquierda" ? "derecha" : "izquierda";
  return (
    <div className="space-y-4">
      <motion.p
        className="rounded-xl border-2 border-[#ff6a5a] bg-[#7a1f1f66] px-4 py-3 text-center text-xl font-extrabold"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        lang="en"
      >
        ⚠️ {q.texto}
      </motion.p>
      <div className="grid grid-cols-2 gap-3">
        {(["izquierda", "derecha"] as const).map((lado) => (
          <motion.button
            key={lado}
            type="button"
            disabled={disabled}
            onMouseEnter={() => onPreview(lado)}
            onFocus={() => onPreview(lado)}
            onMouseLeave={() => onPreview(null)}
            onBlur={() => onPreview(null)}
            onClick={() => onDodge(lado)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            animate={hint && lado === safe ? { boxShadow: ["0 0 0 #7bd88f00", "0 0 22px #7bd88f"] } : undefined}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.7 }}
            className="btn btn-ghost flex-col !py-6 text-lg"
          >
            <span className="text-4xl">{lado === "izquierda" ? "⬅️" : "➡️"}</span>
            <span lang="en">Move {lado === "izquierda" ? "left" : "right"}</span>
            <span className="text-xs font-normal opacity-70">tecla {lado === "izquierda" ? "←" : "→"}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
