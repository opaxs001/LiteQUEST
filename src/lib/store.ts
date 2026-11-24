"use client";
import { useCallback, useEffect, useState } from "react";

export type LevelStat = {
  stars: number;
  bestScore: number;
  bestAccuracy: number;
  attempts: number;
  wins: number;
};
export type Save = {
  player: { id: string | null; name: string } | null;
  xp: number;
  levels: Record<number, LevelStat>;
};

const KEY = "eq-save-v2";
const EMPTY: Save = { player: null, xp: 0, levels: {} };

export function readSave(): Save {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  return EMPTY;
}

export function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("eq-save"));
  } catch {}
}

export function useSave() {
  const [save, setSave] = useState<Save>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSave(readSave());
    sync();
    setReady(true);
    window.addEventListener("eq-save", sync);
    return () => window.removeEventListener("eq-save", sync);
  }, []);

  const register = useCallback(async (name: string) => {
    const clean = name.trim().replace(/\s+/g, " ").slice(0, 24);
    let id: string | null = null;
    try {
      const r = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      if (r.ok) id = ((await r.json()) as { id: string }).id;
    } catch {}
    writeSave({ ...readSave(), player: { id, name: clean } });
  }, []);

  const logout = useCallback(() => writeSave(EMPTY), []);

  // Sincroniza con la base de datos al abrir (se queda con lo mejor de cada lado)
  const pull = useCallback(async () => {
    const cur = readSave();
    const id = cur.player?.id;
    if (!id) return;
    try {
      const r = await fetch(`/api/players/${id}`);
      if (!r.ok) return;
      const data = (await r.json()) as {
        player: { xp: number };
        levels: (LevelStat & { level: number })[];
      };
      const levels = { ...cur.levels };
      for (const l of data.levels) {
        const mine = levels[l.level];
        levels[l.level] = {
          stars: Math.max(mine?.stars ?? 0, l.stars),
          bestScore: Math.max(mine?.bestScore ?? 0, l.bestScore),
          bestAccuracy: Math.max(mine?.bestAccuracy ?? 0, l.bestAccuracy),
          attempts: Math.max(mine?.attempts ?? 0, l.attempts),
          wins: Math.max(mine?.wins ?? 0, l.wins),
        };
      }
      writeSave({ ...cur, xp: Math.max(cur.xp, data.player.xp), levels });
    } catch {}
  }, []);

  return { save, ready, register, logout, pull };
}

export function nivelDesbloqueado(levels: Save["levels"]) {
  let n = 1;
  while (levels[n]?.wins > 0 && n <= 4) n++;
  return n;
}

export function rango(xp: number) {
  const tabla = [
    { min: 0, nombre: "Escudero" },
    { min: 150, nombre: "Caballero" },
    { min: 400, nombre: "Capitán" },
    { min: 800, nombre: "Campeón del Reino" },
  ];
  let actual = tabla[0];
  let siguiente: (typeof tabla)[number] | null = null;
  for (let i = 0; i < tabla.length; i++) {
    if (xp >= tabla[i].min) {
      actual = tabla[i];
      siguiente = tabla[i + 1] ?? null;
    }
  }
  return { actual, siguiente };
}

export async function reportResult(r: {
  level: number;
  won: boolean;
  score: number;
  stars: number;
  accuracy: number;
  xp: number;
}) {
  const cur = readSave();
  const prev = cur.levels[r.level];
  const levels = {
    ...cur.levels,
    [r.level]: {
      stars: Math.max(prev?.stars ?? 0, r.won ? r.stars : 0),
      bestScore: Math.max(prev?.bestScore ?? 0, r.score),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, r.accuracy),
      attempts: (prev?.attempts ?? 0) + 1,
      wins: (prev?.wins ?? 0) + (r.won ? 1 : 0),
    },
  };
  writeSave({ ...cur, xp: cur.xp + r.xp, levels });
  const id = cur.player?.id;
  if (id) {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id, ...r }),
      });
    } catch {}
  }
}
