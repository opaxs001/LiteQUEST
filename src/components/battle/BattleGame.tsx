"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ATAQUES, NIVELES, type Ataque, type Nivel, type Q } from "@/data/levels";
import { Music, SoundToggle } from "@/components/ui";
import { reportResult } from "@/lib/store";
import { click, sfx } from "@/lib/sound";
import { shuffle } from "@/lib/text";
import { Scene, usePreloadPoses, type Fx, type Float, type SceneState } from "./Scene";
import { AxeQ } from "./questions/AxeQ";
import { ChoiceQ } from "./questions/ChoiceQ";
import { ClassifyQ } from "./questions/ClassifyQ";
import { DodgeQ } from "./questions/DodgeQ";
import { MatchQ } from "./questions/MatchQ";
import { OrderQ } from "./questions/OrderQ";
import { PromiseQ } from "./questions/PromiseQ";
import { SpellQ } from "./questions/SpellQ";
import { TypeQ } from "./questions/TypeQ";

type Phase = "intro" | "pregunta" | "elegir" | "animando" | "atacando" | "revision" | "fin";
type Rec = { q: Q; text: string; ok: boolean; timeout: boolean };
type Last = { ok: boolean; timeout: boolean; text: string; dodged?: boolean; note?: string };

const TIEMPOS: Record<Q["tipo"], number> = {
  clasificar: 26,
  ordenar: 28,
  elegir: 14,
  hacha: 8,
  esquivar: 8,
  "esquiva-frase": 10,
  hechizo: 20,
  promesa: 22,
  zona: 14,
  escuchar: 18,
  parejas: 30,
  escribir: 24,
};

const ETIQUETA: Record<Q["tipo"], string> = {
  clasificar: "🎯 Clasificar",
  ordenar: "🧩 Ordenar frase",
  elegir: "⚔️ Elegir",
  hacha: "🪓 Reflejos",
  esquivar: "💨 Esquivar",
  "esquiva-frase": "💨 Esquiva-frase",
  hechizo: "✨ Romper hechizo",
  promesa: "🤝 Promesa",
  zona: "🚦 Señales",
  escuchar: "👂 Escuchar",
  parejas: "🃏 Parejas",
  escribir: "⌨️ Escribir",
};

const INSTRUCCION: Record<Q["tipo"], string> = {
  clasificar: "Suelta las palabras sobre los personajes antes de que ataque el guardián.",
  ordenar: "Toca las fichas en el orden correcto para formar la frase.",
  elegir: "Elige la opción correcta. Si fallas, el guardián te ataca.",
  hacha: "Desliza el hacha y corta las tres bolas antes de que lleguen al caballero.",
  esquivar: "Lee el aviso y elige hacia qué lado esquivar.",
  "esquiva-frase": "Elige la frase que completa el aviso para activar la esquiva.",
  hechizo: "Coloca la runa en el hueco correcto para devolver la magia al guardián.",
  promesa: "Une las palabras de la promesa en el orden correcto.",
  zona: "Mira la señal y elige qué debe hacer el jinete.",
  escuchar: "Escucha con atención y elige la respuesta correcta.",
  parejas: "Une cada palabra en inglés con su significado.",
  escribir: "Escribe la palabra que falta.",
};

const REMATE: Record<string, string> = {
  solar: "¡Ascensión solar!",
  cruzado: "¡Corte cruzado!",
  sombras: "¡Alzaos, sombras!",
};

const INITIAL_SCENE: SceneState = {
  knightPose: "reposo",
  bossPose: "reposo",
  knightX: 0,
  bossX: 0,
  knightOffset: 0,
  fx: [],
  floats: [],
  shake: 0,
  flash: null,
  flashId: 0,
  charge: 0,
  shield: false,
  bossDown: false,
  knightDown: false,
  banner: null,
  zoom: false,
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const MAX_RONDAS = 18;

export default function BattleGame({ numero }: { numero: number }) {
  const nivel = NIVELES.find((n) => n.numero === numero) as Nivel;
  const [mounted, setMounted] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="grid min-h-dvh place-items-center font-title text-xl text-[var(--gold)]">Preparando el duelo…</div>;
  }
  return <Battle key={`${numero}-${intento}`} nivel={nivel} onRetry={() => setIntento((i) => i + 1)} />;
}

function Battle({ nivel, onRetry }: { nivel: Nivel; onRetry: () => void }) {
  const router = useRouter();
  usePreloadPoses(nivel);

  const baseQs = useMemo(() => nivel.preguntas, [nivel]);
  const [queue, setQueue] = useState<Q[]>(baseQs);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [scene, setScene] = useState<SceneState>(INITIAL_SCENE);
  const [hpK, setHpK] = useState(100);
  const [hpB, setHpB] = useState(nivel.vida);
  const hpKRef = useRef(100);
  const hpBRef = useRef(nivel.vida);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const maxStreakRef = useRef(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [remaining, setRemaining] = useState(10);
  const remRef = useRef(10);
  const [paused, setPaused] = useState(false);
  const [hints, setHints] = useState(2);
  const [hintOn, setHintOn] = useState(false);
  const [shield, setShield] = useState(false);
  const shieldRef = useRef(false);
  const [rayoUsado, setRayoUsado] = useState(false);
  const [history, setHistory] = useState<Rec[]>([]);
  const historyRef = useRef<Rec[]>([]);
  const [last, setLast] = useState<Last | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [won, setWon] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<{ stars: number; xp: number; accuracy: number; score: number } | null>(null);
  const idRef = useRef(1);
  const alive = useRef(true);
  const phaseRef = useRef<Phase>("intro");
  const misses = useRef(0);

  const q = queue[idx];
  const total = TIEMPOS[q.tipo];
  const isExtra = idx >= baseQs.length;

  const goPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // ---------- helpers de escena ----------
  const patch = useCallback((p: Partial<SceneState>) => setScene((s) => ({ ...s, ...p })), []);
  const addFx = useCallback((src: string, place: Fx["place"], ms = 900) => {
    const id = idRef.current++;
    setScene((s) => ({ ...s, fx: [...s.fx, { id, src, place }] }));
    setTimeout(() => setScene((s) => ({ ...s, fx: s.fx.filter((f) => f.id !== id) })), ms);
  }, []);
  const addFloat = useCallback((text: string, side: Float["side"], kind: Float["kind"]) => {
    const id = idRef.current++;
    setScene((s) => ({ ...s, floats: [...s.floats, { id, text, side, kind }] }));
    setTimeout(() => setScene((s) => ({ ...s, floats: s.floats.filter((f) => f.id !== id) })), 1600);
  }, []);
  const shake = useCallback(() => setScene((s) => ({ ...s, shake: s.shake + 1 })), []);
  const flash = useCallback((f: "hit" | "heal" | "final") => setScene((s) => ({ ...s, flash: f, flashId: s.flashId + 1 })), []);

  const hurtBoss = useCallback((n: number) => {
    const d = Math.min(n, hpBRef.current);
    hpBRef.current -= d;
    setHpB(hpBRef.current);
    return d;
  }, []);
  const hurtKnight = useCallback((n: number) => {
    const d = Math.min(n, hpKRef.current);
    hpKRef.current -= d;
    setHpK(hpKRef.current);
    return d;
  }, []);
  const healKnight = useCallback((n: number) => {
    const d = Math.min(n, 100 - hpKRef.current);
    hpKRef.current += d;
    setHpK(hpKRef.current);
    return d;
  }, []);
  const setShieldBoth = (v: boolean) => {
    shieldRef.current = v;
    setShield(v);
    patch({ shield: v });
  };

  // ---------- fin del duelo ----------
  const finish = useCallback(
    (victoria: boolean, hist: Rec[]) => {
      if (!alive.current) return;
      const correct = hist.filter((h) => h.ok).length;
      const accuracy = hist.length ? Math.round((correct / hist.length) * 100) : 0;
      let stars = 0;
      if (victoria) {
        stars = 1;
        if (accuracy >= 70) stars++;
        if (hpKRef.current >= 50) stars++;
      }
      const finalScore = scoreRef.current + (victoria ? hpKRef.current * 2 : 0);
      const xp = Math.min(1000, correct * 8 + (victoria ? 40 + stars * 10 : 5));
      setWon(victoria);
      setSummary({ stars, xp, accuracy, score: finalScore });
      goPhase("fin");
      sfx(victoria ? "/audio/combate/fenix.mp3" : "/audio/combate/jefe-" + nivel.numero + "-golpe.mp3", 0.6);
      void reportResult({ level: nivel.numero, won: victoria, score: finalScore, stars, accuracy, xp });
    },
    [goPhase, nivel.numero],
  );

  // ---------- secuencias de animación ----------
  const finalBlow = useCallback(
    async (nombre: string, remate?: string) => {
      patch({ banner: nombre, zoom: true, knightPose: "preparacion-hachazo" });
      if (remate === "solar") sfx("/audio/combate/solar-carga.mp3", 0.6);
      await sleep(1100);
      patch({ knightX: 95 });
      await sleep(380);
      patch({ knightPose: "impacto-hachazo", bossPose: "dolor" });
      sfx("/audio/combate/golpe-final.mp3", 0.8);
      sfx(`/audio/combate/jefe-${nivel.numero}-derrota.mp3`, 0.7);
      flash("final");
      shake();
      if (remate === "cruzado") {
        addFx("/images/caballero/barrido.svg", "full", 700);
        await sleep(260);
        addFx("/images/bosque-del-alba/hachazo.svg", "full", 700);
      } else if (remate === "solar") {
        addFx("/images/magia/rayo.svg", "boss", 1000);
        addFx("/images/bosque-del-alba/hachazo.svg", "full", 900);
      } else if (remate === "sombras") {
        for (let i = 0; i < 3; i++) {
          addFx("/images/bosque-del-alba/hachazo.svg", "full", 600);
          shake();
          await sleep(260);
        }
      } else {
        addFx("/images/bosque-del-alba/hachazo.svg", "full", 800);
      }
      patch({ bossPose: "caida", bossDown: true });
      await sleep(1400);
      patch({ knightX: 0, knightPose: "reposo", zoom: false, banner: null });
      await sleep(700);
    },
    [addFx, flash, nivel.numero, patch, shake],
  );

  const playerAttack = useCallback(
    async (move: Ataque, dmg: number, final: boolean) => {
      const prep = `preparacion-${move.id}`;
      const imp = `impacto-${move.id}`;
      const out = move.magia ? "salida-magia" : `salida-${move.id}`;
      const dead = dmg >= hpBRef.current;
      if (final && dead) {
        hurtBoss(dmg);
        addFloat(`−${dmg}`, "boss", "dano");
        await finalBlow(REMATE[nivel.remate ?? ""] ?? "¡Golpe final!", nivel.remate);
        return;
      }
      patch({ knightPose: prep });
      await sleep(move.magia ? 700 : 450);
      if (!move.magia) {
        patch({ knightX: 92 });
        await sleep(300);
      }
      patch({ knightPose: imp, bossPose: "retroceso" });
      sfx(`/audio/combate/${move.id}.mp3`, 0.7);
      addFx(move.efecto, move.id === "rayo" || move.id === "escudo" ? "boss" : "full", 900);
      shake();
      const d = hurtBoss(dmg);
      addFloat(`−${d}`, "boss", "dano");
      if (move.curacion) {
        const h = healKnight(move.curacion);
        flash("heal");
        sfx("/audio/combate/fenix.mp3", 0.5);
        addFx("/images/magia/fenix.svg", "knight", 1000);
        addFloat(h ? `+${h}` : "Vida al máximo", "knight", "cura");
      }
      if (move.id === "escudo") {
        setShieldBoth(true);
        addFloat("🛡️ Escudo listo", "knight", "info");
      }
      await sleep(380);
      patch({ bossPose: "dolor", knightPose: out });
      await sleep(420);
      patch({ bossPose: "tambaleo", knightX: 0 });
      await sleep(420);
      patch({ bossPose: "recuperacion", knightPose: "reposo" });
      await sleep(320);
      patch({ bossPose: "reposo" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addFloat, addFx, finalBlow, flash, healKnight, hurtBoss, nivel.remate, patch, shake],
  );

  const bossAttack = useCallback(
    async (dodged = false, lado?: "izquierda" | "derecha") => {
      let dmg = nivel.dano;
      if (shieldRef.current) dmg = Math.round(dmg * 0.5);
      if (dodged) dmg = 0;
      patch({ bossPose: "preparacion", charge: 1 });
      sfx(`/audio/combate/jefe-${nivel.numero}-grito.mp3`, 0.6);
      if (lado && dodged) patch({ knightOffset: lado === "izquierda" ? -18 : 45, knightPose: "retroceso" });
      await sleep(650);
      patch({ bossX: -88, bossPose: "impacto", charge: 0 });
      await sleep(260);
      sfx(`/audio/combate/jefe-${nivel.numero}-golpe.mp3`, 0.7);
      addFx(nivel.efecto, "full", 900);
      if (dodged) {
        addFloat("¡Esquiva!", "knight", "esquiva");
        await sleep(450);
      } else {
        const d = hurtKnight(dmg);
        patch({ knightPose: "retroceso" });
        shake();
        flash("hit");
        addFloat(`−${d}`, "knight", "dano");
        if (shieldRef.current) {
          setShieldBoth(false);
          addFloat("🛡️ −50%", "knight", "info");
        }
        await sleep(400);
        patch({ knightPose: "dolor" });
        await sleep(300);
      }
      patch({ bossX: 0, bossPose: "reposo" });
      if (hpKRef.current <= 0) {
        patch({ knightPose: "caida", knightDown: true, knightOffset: 0 });
        await sleep(1200);
        return;
      }
      patch({ knightPose: "tambaleo", knightOffset: 0 });
      await sleep(350);
      patch({ knightPose: "recuperacion" });
      await sleep(300);
      patch({ knightPose: "reposo" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addFloat, addFx, flash, hurtKnight, nivel.dano, nivel.efecto, nivel.numero, patch, shake],
  );

  // ---------- registro de respuestas ----------
  const record = useCallback((rec: Rec): Rec[] => {
    historyRef.current = [...historyRef.current, rec];
    setHistory(historyRef.current);
    return historyRef.current;
  }, []);

  const award = useCallback(
    (ok: boolean) => {
      if (ok) {
        streakRef.current += 1;
        maxStreakRef.current = Math.max(maxStreakRef.current, streakRef.current);
        setMaxStreak(maxStreakRef.current);
        const bonus = 25 * Math.min(streakRef.current - 1, 4) + Math.round((remRef.current / total) * 50);
        scoreRef.current += 100 + bonus;
        setScore(scoreRef.current);
      } else {
        streakRef.current = 0;
      }
      setStreak(streakRef.current);
    },
    [total],
  );

  const afterWrong = useCallback(
    async (rec: Rec, dodged = false, lado?: "izquierda" | "derecha") => {
      goPhase("animando");
      const hist = record(rec);
      setLast({ ok: dodged, timeout: rec.timeout, text: rec.text, dodged });
      await bossAttack(dodged, lado);
      if (hpKRef.current <= 0) return finish(false, hist);
      if (dodged) {
        patch({ banner: "¡Contraataca!" });
        setTimeout(() => patch({ banner: null }), 900);
        goPhase("elegir");
      } else goPhase("revision");
    },
    [bossAttack, finish, goPhase, patch, record],
  );

  const answered = useCallback(
    async (ok: boolean, text: string, opts?: { lado?: "izquierda" | "derecha" }) => {
      if (phaseRef.current !== "pregunta") return;
      const cur = queue[idx];
      const rec: Rec = { q: cur, text, ok, timeout: false };
      const dodgeType = cur.tipo === "esquivar" || cur.tipo === "esquiva-frase";
      award(ok);
      if (!ok) {
        sfx("/audio/combate/escudo.mp3", 0.2);
        return afterWrong(rec);
      }
      if (!dodgeType) patch({ charge: 0, bossPose: "reposo" });
      if (dodgeType) {
        return afterWrong(rec, true, opts?.lado ?? "izquierda");
      }
      const hist = record(rec);
      setLast({ ok: true, timeout: false, text });
      goPhase("animando");
      if (cur.tipo === "hechizo") {
        addFx("/images/magia/sello.svg", "boss", 1000);
        sfx("/audio/combate/rayo.mp3", 0.6);
        const d = hurtBoss(12);
        patch({ bossPose: "dolor" });
        shake();
        addFloat(`−${d}`, "boss", "dano");
        await sleep(900);
        patch({ bossPose: "reposo" });
        if (hpBRef.current <= 0) {
          patch({ bossPose: "caida", bossDown: true });
          sfx(`/audio/combate/jefe-${nivel.numero}-derrota.mp3`, 0.7);
          await sleep(1500);
          return finish(true, hist);
        }
      } else if (cur.tipo === "promesa") {
        setShieldBoth(true);
        sfx("/audio/combate/escudo.mp3", 0.6);
        addFloat("🛡️ Aliado protegido", "knight", "info");
        await sleep(800);
      } else if (cur.tipo === "hacha") {
        sfx("/audio/combate/escudo.mp3", 0.6);
        patch({ banner: "¡Interceptado!" });
        await sleep(800);
        patch({ banner: null });
      } else {
        sfx("/audio/combate/barrido.mp3", 0.25);
        await sleep(250);
      }
      goPhase("elegir");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addFloat, addFx, afterWrong, award, finish, goPhase, hurtBoss, idx, nivel.numero, patch, queue, record, shake],
  );

  const timeout = useCallback(() => {
    if (phaseRef.current !== "pregunta") return;
    award(false);
    void afterWrong({ q: queue[idx], text: "", ok: false, timeout: true });
  }, [afterWrong, award, idx, queue]);

  // ---------- temporizador ----------
  useEffect(() => {
    if (phase !== "pregunta") return;
    remRef.current = total;
    setRemaining(total);
    let lastT = performance.now();
    const iv = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      lastT = now;
      if (document.hidden || paused) return;
      remRef.current = Math.max(0, remRef.current - dt);
      setRemaining(remRef.current);
      const c = 1 - remRef.current / total;
      setScene((s) => ({
        ...s,
        charge: c,
        bossPose: c > 0.72 && s.bossPose === "reposo" ? "preparacion" : s.bossPose,
      }));
      if (remRef.current <= 0) {
        clearInterval(iv);
        timeout();
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, paused]);

  // Intro
  useEffect(() => {
    sfx(`/audio/combate/jefe-${nivel.numero}-grito.mp3`, 0.7);
    patch({ banner: "¡Duelo!" });
    const t1 = setTimeout(() => patch({ banner: null }), 1100);
    const t2 = setTimeout(() => goPhase("pregunta"), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [goPhase, nivel.numero, patch]);

  // ---------- acciones del jugador ----------
  const atacar = async (move: Ataque) => {
    if (phaseRef.current !== "elegir") return;
    if (move.id === "rayo") {
      if (rayoUsado) return;
      setRayoUsado(true);
    }
    click();
    goPhase("atacando");
    const base = move.dano + (nivel.debilidad === move.id ? 4 : 0);
    const mult = 1 + Math.min(Math.max(streakRef.current - 1, 0), 3) * 0.1;
    const dmg = Math.round(base * mult);
    const final = dmg >= hpBRef.current;
    await playerAttack(move, dmg, final);
    if (hpBRef.current <= 0) {
      return finish(true, history);
    }
    goPhase("revision");
  };

  const siguiente = useCallback(() => {
    if (phaseRef.current !== "revision") return;
    click();
    if (idx + 1 >= MAX_RONDAS + baseQs.length) return finish(false, history);
    if (idx + 1 >= queue.length) {
      setQueue((qq) => [...qq, ...shuffle(baseQs.filter((x) => x.tipo !== "clasificar"))]);
    }
    setIdx((i) => i + 1);
    setHintOn(false);
    setLast(null);
    misses.current = 0;
    patch({ knightOffset: 0 });
    goPhase("pregunta");
  }, [baseQs, finish, goPhase, history, idx, patch, queue.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter" && phaseRef.current === "revision" && document.activeElement === document.body) siguiente();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [siguiente]);

  const pedirPista = () => {
    if (hints <= 0 || hintOn || phase !== "pregunta") return;
    click();
    setHints((h) => h - 1);
    setHintOn(true);
  };

  // Clasificar: cada acierto hiere/cura en directo
  const onClassHit = (dest: "heroe" | "monstruo") => {
    if (phaseRef.current !== "pregunta") return;
    if (dest === "heroe") {
      const h = healKnight(8);
      addFloat(h ? `+${h}` : "Vida al máximo", "knight", "cura");
      flash("heal");
    } else {
      const d = hurtBoss(14);
      addFloat(`−${d}`, "boss", "dano");
      sfx("/audio/combate/escudo.mp3", 0.5);
      patch({ bossPose: "retroceso" });
      shake();
      setTimeout(() => patch({ bossPose: "reposo" }), 400);
    }
  };
  const onClassMiss = () => {
    misses.current++;
    addFloat("¡Ese no!", "knight", "error");
    sfx("/audio/combate/escudo.mp3", 0.15);
    remRef.current = Math.max(1, remRef.current - 2);
  };
  const onClassDone = async () => {
    if (phaseRef.current !== "pregunta") return;
    const ok = misses.current === 0;
    const rec: Rec = { q, text: q.correcta, ok, timeout: false };
    const hist = record(rec);
    award(true);
    patch({ charge: 0, bossPose: "reposo" });
    setLast({ ok: true, timeout: false, text: q.correcta, note: misses.current ? `${misses.current} intento(s) fallidos.` : undefined });
    goPhase("animando");
    await sleep(500);
    if (hpBRef.current <= 0) {
      patch({ bossPose: "caida", bossDown: true });
      sfx(`/audio/combate/jefe-${nivel.numero}-derrota.mp3`, 0.7);
      await sleep(1500);
      return finish(true, hist);
    }
    goPhase("revision");
  };

  const dodge = (lado: "izquierda" | "derecha") => {
    if (q.tipo !== "esquivar") return;
    const ok = lado !== q.lado;
    patch({ knightOffset: 0 });
    void answered(ok, lado === "izquierda" ? "Move left." : "Move right.", { lado });
  };

  // ---------- render ----------
  const progress = 1 - remaining / total;
  const urgente = remaining <= 3;
  const locked = phase !== "pregunta" || paused;
  const correctas = history.filter((h) => h.ok).length;

  const renderQuestion = () => {
    const common = { hint: hintOn, disabled: locked };
    switch (q.tipo) {
      case "ordenar":
        return <OrderQ key={`${idx}-${q.correcta}`} q={q} {...common} onAnswer={answered} />;
      case "elegir":
      case "escuchar":
      case "esquiva-frase":
      case "zona":
        return <ChoiceQ key={`${idx}-${q.texto}`} q={q} {...common} onAnswer={(ok, t) => answered(ok, t, { lado: q.tipo === "esquiva-frase" ? "izquierda" : undefined })} />;
      case "escribir":
        return <TypeQ key={`${idx}-${q.texto}`} q={q} {...common} onAnswer={answered} />;
      case "parejas":
        return <MatchQ key={`${idx}-${q.texto}`} q={q} {...common} onAnswer={answered} />;
      case "hechizo":
        return <SpellQ key={`${idx}-${q.texto}`} q={q} {...common} onAnswer={answered} />;
      case "promesa":
        return <PromiseQ key={`${idx}-${q.texto}`} q={q} {...common} onAnswer={answered} />;
      case "clasificar":
        return <ClassifyQ key={`${idx}-${q.texto}`} q={q} {...common} onHit={onClassHit} onMiss={onClassMiss} onComplete={onClassDone} />;
      case "esquivar":
        return <DodgeQ key={`${idx}-${q.texto}`} q={q} {...common} onDodge={dodge} onPreview={(l) => patch({ knightOffset: l === null ? 0 : l === "izquierda" ? -10 : 18 })} />;
      case "hacha":
        return <AxeQ key={`${idx}-${q.texto}`} texto={q.texto} progress={progress} disabled={locked} onSuccess={() => answered(true, q.correcta)} />;
    }
  };

  const pistaTexto =
    hintOn && "pista" in q && q.pista
      ? q.pista
      : hintOn
        ? q.tipo === "esquivar"
          ? `El ataque viene por la ${q.lado}. Mueve al lado contrario.`
          : "Elimina una opción incorrecta o mira lo resaltado."
        : null;

  return (
    <main
      className="relative min-h-dvh px-3 pb-8 pt-3 sm:px-5"
      style={{ background: `radial-gradient(ellipse at top, ${nivel.color}22 0%, #0b1325 62%)` }}
    >
      <Music src={`/audio/combate/batalla-${nivel.numero}.mp3`} volume={0.35} />
      <header className="mx-auto mb-3 flex max-w-6xl items-center gap-3">
        <button type="button" className="btn btn-ghost !px-4 !py-2 text-sm" onClick={() => { click(); router.push("/map"); }}>
          ← Mapa
        </button>
        <h1 className="font-title min-w-0 flex-1 truncate text-lg font-extrabold text-[var(--gold)] sm:text-2xl">
          {nivel.nombre} <small className="ml-1 hidden text-sm font-bold text-[#9bd0ff] sm:inline">{nivel.tema}</small>
        </h1>
        <span className="card-glass hidden px-3 py-1 text-sm sm:block">✨ {score}</span>
        <SoundToggle />
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-3">
          <Scene nivel={nivel} s={scene} hpK={hpK} hpB={hpB} streak={streak} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="card-glass px-3 py-1">Aciertos <strong>{correctas}</strong>/{history.length}</span>
            <span className="card-glass px-3 py-1">💡 Pistas <strong>{hints}</strong></span>
            <span className="card-glass px-3 py-1">Debilidad: <strong className="capitalize text-[var(--gold)]">{nivel.debilidad}</strong></span>
            {shield && <span className="card-glass px-3 py-1 text-[#9bd0ff]">🛡️ Escudo preparado</span>}
          </div>
        </div>

        <aside className="card-glass relative min-h-[420px] p-4 sm:p-5" aria-label="Desafío de inglés">
          <AnimatePresence mode="wait">
            {phase === "fin" && summary ? (
              <motion.div key="fin" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <FinPanel
                  nivel={nivel}
                  won={!!won}
                  summary={summary}
                  history={history}
                  maxStreak={maxStreak}
                  hpK={hpK}
                  onRetry={onRetry}
                  onMap={() => router.push("/map")}
                  onNext={() => router.push(`/battle/${nivel.numero + 1}`)}
                />
              </motion.div>
            ) : (
              <motion.div key="juego" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-title text-sm font-extrabold tracking-widest text-[#9bd0ff]">
                    {isExtra ? "RONDA EXTRA" : `DESAFÍO ${idx + 1} / ${baseQs.length}`}
                  </p>
                  <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold">{ETIQUETA[q.tipo]}</span>
                </div>

                {phase === "pregunta" || phase === "intro" || phase === "animando" ? (
                  <>
                    <p className="mb-3 text-sm text-[#cdd6ea]">{INSTRUCCION[q.tipo]}</p>
                    <div className="mb-4 flex items-center gap-3" role="timer" aria-label="Tiempo restante">
                      <div className="h-3.5 flex-1 overflow-hidden rounded-full border border-black bg-black/50">
                        <div
                          className="h-full origin-left rounded-full"
                          style={{
                            transform: `scaleX(${phase === "intro" ? 1 : remaining / total})`,
                            transition: "transform 100ms linear",
                            background: urgente ? "linear-gradient(90deg,#ff6a3a,#ff2d2d)" : "linear-gradient(90deg,#7bd88f,#ffe09a)",
                            animation: urgente ? "charge-glow 0.6s infinite" : undefined,
                          }}
                        />
                      </div>
                      <span className={`font-title w-12 text-right text-lg font-black tabular-nums ${urgente ? "text-[#ff6a5a]" : ""}`}>{Math.ceil(remaining)}s</span>
                      <button type="button" aria-label="Pausar" className="btn btn-ghost !px-2.5 !py-1 text-base" onClick={() => setPaused(true)} disabled={phase !== "pregunta"}>⏸</button>
                    </div>

                    <AnimatePresence>
                      {pistaTexto && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 overflow-hidden rounded-lg border border-[#7bd88f88] bg-[#7bd88f18] px-3 py-2 text-sm"
                        >
                          💡 {pistaTexto}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <div className={paused ? "pointer-events-none select-none opacity-0" : ""}>{phase !== "intro" && renderQuestion()}</div>

                    {phase === "pregunta" && !paused && (
                      <button type="button" className="btn btn-ghost mt-4 w-full !py-2 text-sm" disabled={hints <= 0 || hintOn} onClick={pedirPista}>
                        💡 Usar pista ({hints})
                      </button>
                    )}
                    {paused && (
                      <div className="absolute inset-0 z-10 grid place-items-center rounded-[1.1rem] bg-[#0b1325f2] backdrop-blur-md">
                        <div className="text-center">
                          <p className="font-deco mb-4 text-3xl font-black text-[var(--gold)]">Pausa</p>
                          <button type="button" className="btn btn-gold" onClick={() => setPaused(false)}>▶ Reanudar</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : phase === "elegir" ? (
                  <div className="space-y-3">
                    <motion.h2 initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="font-title text-xl font-extrabold text-[#7bd88f]">
                      ✔ ¡Acertaste! Elige tu ataque
                    </motion.h2>
                    {streak >= 2 && <p className="text-sm text-[#ffe09a]">🔥 Racha ×{streak}: +{Math.min(streak - 1, 3) * 10}% de daño</p>}
                    <div className="grid gap-2.5">
                      {ATAQUES.map((m, i) => {
                        const weak = nivel.debilidad === m.id;
                        const disabled = m.id === "rayo" && rayoUsado;
                        const base = m.dano + (weak ? 4 : 0);
                        const dmg = Math.round(base * (1 + Math.min(Math.max(streak - 1, 0), 3) * 0.1));
                        return (
                          <motion.button
                            key={m.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => atacar(m)}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            whileHover={disabled ? undefined : { scale: 1.03, x: 5 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative flex items-center gap-3 overflow-hidden rounded-xl border-2 px-4 py-2.5 text-left disabled:opacity-40"
                            style={{
                              borderColor: weak ? "#ffe09a" : m.magia ? "#6ec6ff" : "#be9348",
                              background: weak ? "linear-gradient(90deg,#4a3a12,#2a2208)" : "#1a2644",
                            }}
                          >
                            <span className="text-2xl">{m.icono}</span>
                            <span className="min-w-0 flex-1">
                              <strong className="font-title block text-sm sm:text-base">{m.nombre}</strong>
                              <small className="text-[#cdd6ea]">
                                {disabled ? "Ya lo usaste en este duelo" : m.descripcion}
                              </small>
                            </span>
                            <span className="text-right">
                              <strong className="font-title text-lg text-[#ff9a8a]">{dmg}</strong>
                              <small className="block text-[10px] text-[#9aa7c7]">daño</small>
                            </span>
                            {weak && <span className="absolute right-1 top-0 text-[10px] font-black text-[#ffe09a]">★ DÉBIL</span>}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ) : phase === "atacando" ? (
                  <div className="grid min-h-[300px] place-items-center text-center">
                    <div>
                      <motion.div className="mb-3 text-6xl" animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                        ⚔️
                      </motion.div>
                      <p className="font-title text-lg font-bold" role="status">¡Combate!</p>
                    </div>
                  </div>
                ) : (
                  <RevisionPanel q={q} last={last} onNext={siguiente} streak={streak} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </main>
  );
}

function RevisionPanel({ q, last, onNext, streak }: { q: Q; last: Last | null; onNext: () => void; streak: number }) {
  const ok = !!last?.ok;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <motion.h2
        initial={{ scale: 0.6, rotate: -4 }}
        animate={{ scale: 1, rotate: 0 }}
        className="font-title text-2xl font-extrabold"
        style={{ color: ok ? "#7bd88f" : "#ff8a7a" }}
      >
        {ok ? (streak >= 3 ? `🔥 ¡Racha ×${streak}!` : "✔ ¡Buen golpe!") : last?.timeout ? "⏰ Se acabó el tiempo" : "✖ El guardián te alcanzó"}
      </motion.h2>
      {last?.text && !ok && (
        <p className="rounded-lg bg-[#7a1f1f55] px-3 py-2 text-sm">Tu respuesta: <span lang="en" className="font-bold">{last.text}</span></p>
      )}
      <p className="rounded-lg bg-[#1f6b3a55] px-3 py-2">
        Respuesta correcta: <strong lang="en" className="text-[#b9f5c9]">{q.correcta}</strong>
      </p>
      <p className="rounded-lg border border-[#9bd0ff55] bg-[#9bd0ff12] px-3 py-2 text-sm">📘 {q.explicacion}</p>
      {last?.note && <p className="text-sm text-[#ffb74a]">{last.note}</p>}
      <button type="button" className="btn btn-gold w-full" onClick={onNext}>
        Siguiente pregunta ⏎
      </button>
    </motion.div>
  );
}

function FinPanel({
  nivel,
  won,
  summary,
  history,
  maxStreak,
  hpK,
  onRetry,
  onMap,
  onNext,
}: {
  nivel: Nivel;
  won: boolean;
  summary: { stars: number; xp: number; accuracy: number; score: number };
  history: Rec[];
  maxStreak: number;
  hpK: number;
  onRetry: () => void;
  onMap: () => void;
  onNext: () => void;
}) {
  const [show, setShow] = useState(0);
  useEffect(() => {
    if (!won) return;
    const ts = [1, 2, 3].map((n) => setTimeout(() => {
      if (n <= summary.stars) {
        setShow(n);
        sfx("/audio/boton.mp3", 0.6);
      }
    }, 500 + n * 600));
    return () => ts.forEach(clearTimeout);
  }, [won, summary.stars]);

  return (
    <>
      <motion.h2
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="font-deco text-center text-3xl font-black"
        style={{ color: won ? "var(--gold)" : "#ff8a7a" }}
      >
        {won ? "¡Victoria!" : hpK <= 0 ? "Caíste en combate" : "El guardián resistió"}
      </motion.h2>
      <p className="text-center text-[#cdd6ea]">
        {won ? `Derrotaste a ${nivel.guardian}.` : "No te rindas: repasa la lección y vuelve a intentarlo."}
      </p>
      {won && (
        <div className="flex justify-center gap-1 py-1">
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              className="text-5xl"
              initial={{ scale: 0, rotate: -90 }}
              animate={n <= show ? { scale: [0, 1.5, 1], rotate: 0 } : { scale: 1, rotate: 0 }}
              style={{ filter: n <= show ? "drop-shadow(0 0 12px #ffd36b)" : "grayscale(1) opacity(.3)" }}
            >
              ⭐
            </motion.span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        {[
          ["Puntaje", summary.score],
          ["XP ganada", `+${summary.xp}`],
          ["Precisión", `${summary.accuracy}%`],
          ["Mejor racha", `×${maxStreak}`],
        ].map(([k, v], i) => (
          <motion.div key={k} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="rounded-xl bg-white/5 px-2 py-2">
            <p className="text-xs text-[#9aa7c7]">{k}</p>
            <p className="font-title text-xl font-extrabold text-[var(--gold)]">{v}</p>
          </motion.div>
        ))}
      </div>
      <details className="rounded-xl bg-white/5 px-3 py-2">
        <summary className="cursor-pointer font-bold">Revisar respuestas ({history.length})</summary>
        <ol className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
          {history.map((h, i) => (
            <li key={i} className="rounded-lg bg-black/20 p-2">
              <p lang="en" className="font-bold">{h.ok ? "✔" : "✖"} {h.q.texto}</p>
              {!h.ok && <p>Tu respuesta: <span lang="en">{h.text || "Sin respuesta"}</span></p>}
              <p>Correcta: <strong lang="en">{h.q.correcta}</strong></p>
              <p className="text-[#9aa7c7]">{h.q.explicacion}</p>
            </li>
          ))}
        </ol>
      </details>
      <div className="grid gap-2">
        {won && nivel.numero < 4 && (
          <button type="button" className="btn btn-gold" onClick={() => { click(); onNext(); }}>
            Siguiente zona →
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-ghost" onClick={() => { click(); onMap(); }}>🗺️ Mapa</button>
          <button type="button" className="btn btn-ghost" onClick={() => { click(); onRetry(); }}>↻ Reintentar</button>
        </div>
      </div>
    </>
  );
}
