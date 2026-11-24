"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Portal } from "@/components/Portal";
import { Fireflies, GoldButton, Modal, Music, SoundToggle } from "@/components/ui";
import { setSettings, useSoundSettings } from "@/lib/sound";
import { rango, useSave } from "@/lib/store";

type Row = { id: string; name: string; xp: number; stars: number; zones: number };

export default function Home() {
  const router = useRouter();
  const { save, ready, register, logout } = useSave();
  const sound = useSoundSettings();
  const [travelling, setTravelling] = useState(false);
  const [modal, setModal] = useState<null | "how" | "rank" | "name" | "options">(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [ranking, setRanking] = useState<Row[] | null>(null);

  const goMap = useCallback(() => router.push("/map"), [router]);

  useEffect(() => {
    router.prefetch("/map");
  }, [router]);

  useEffect(() => {
    if (modal !== "rank") return;
    setRanking(null);
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d: { ranking: Row[] }) => setRanking(d.ranking))
      .catch(() => setRanking([]));
  }, [modal]);

  function start() {
    if (!save.player) setModal("name");
    else setTravelling(true);
  }

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true);
    await register(name);
    setSaving(false);
    setModal(null);
    setTravelling(true);
  }

  const r = rango(save.xp);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Music src="/audio/interfazentrada.mp3" volume={0.5} />

      {/* Fondo en capas con parallax suave */}
      <motion.div
        className="absolute inset-[-4%] bg-cover bg-center"
        style={{ backgroundImage: "url(/images/arenas/bosque-del-alba-animado.svg)" }}
        animate={{ scale: travelling ? 1.25 : 1.05 }}
        transition={{ duration: 2, ease: "easeIn" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1325cc] via-[#0b132566] to-[#0b1325f2]" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_30%_20%,#7a4cff33,transparent_60%)]" />
      <Fireflies count={26} />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        {save.player && (
          <span className="card-glass hidden px-3 py-1.5 text-sm sm:block">
            🛡️ <strong>{save.player.name}</strong> · {r.actual.nombre} · {save.xp} XP
          </span>
        )}
        <SoundToggle />
      </div>

      {/* Personajes */}
      <motion.img
        src="/images/personajes-mate/caballero/reposo.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute bottom-[-4%] left-[-6%] w-[62vw] max-w-[560px] select-none sm:left-[3%]"
        style={{ filter: "drop-shadow(0 18px 18px #000a)" }}
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: travelling ? 160 : 0, opacity: 1 }}
        transition={{ duration: travelling ? 1.8 : 1.1, delay: travelling ? 0 : 0.5, type: "spring", damping: 18 }}
      />
      <motion.img
        src="/images/personajes-mate/grifo/reposo.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute bottom-[-4%] right-[-14%] hidden w-[48vw] max-w-[600px] select-none md:block"
        style={{ filter: "drop-shadow(0 18px 18px #000a)", animation: "breathe 4s ease-in-out infinite", transformOrigin: "bottom" }}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8, type: "spring", damping: 20 }}
      />

      <section className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col justify-center gap-10 px-6 py-16">
        <div>
          <motion.p
            className="font-title mb-2 text-sm font-bold tracking-[0.5em] text-[#9bd0ff] sm:text-base"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            OVA · APRENDE INGLÉS JUGANDO
          </motion.p>
          <h1 className="font-deco text-5xl font-black leading-[0.95] sm:text-7xl md:text-8xl">
            {["English", "Quest"].map((w, wi) => (
              <span key={w} className="block overflow-hidden pb-2">
                <motion.span
                  className="block bg-gradient-to-b from-[#fff3cf] via-[#ffd36b] to-[#c98f2e] bg-clip-text text-transparent"
                  style={{ filter: "drop-shadow(0 4px 0 #5a3a0acc) drop-shadow(0 0 24px #ffb84a66)" }}
                  initial={{ y: "110%", rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ delay: 0.3 + wi * 0.18, type: "spring", damping: 16, stiffness: 120 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-4 max-w-md text-lg text-[#e8dcc0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Derrota a los guardianes del reino con gramática, vocabulario y reflejos.
          </motion.p>
        </div>

        <nav aria-label="Menú principal" className="flex max-w-sm flex-col gap-4">
          {[
            <GoldButton key="s" onClick={start} className="!py-4 text-lg" disabled={!ready}>
              ⚔️ {save.player ? "Continuar aventura" : "Comenzar aventura"}
            </GoldButton>,
            <GoldButton key="h" variant="ghost" onClick={() => setModal("how")}>
              📖 Cómo jugar
            </GoldButton>,
            <GoldButton key="r" variant="ghost" onClick={() => setModal("rank")}>
              🏆 Ranking del reino
            </GoldButton>,
            <GoldButton key="o" variant="ghost" onClick={() => setModal("options")}>
              ⚙️ Opciones
            </GoldButton>,
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.12, type: "spring", damping: 20 }}
            >
              {b}
            </motion.div>
          ))}
        </nav>
      </section>

      <Modal open={modal === "how"} onClose={() => setModal(null)} title="📖 Cómo jugar">
        <ol className="space-y-3">
          {[
            ["🗺️", "Elige una zona en el mapa. Lee la mini-lección antes de pelear."],
            ["⏱️", "Cada ronda es una pregunta con tiempo: ordenar frases, arrastrar palabras, escuchar, emparejar, esquivar y más."],
            ["⚔️", "Si aciertas, eliges un ataque. Los golpes que explotan la debilidad del guardián hacen más daño."],
            ["🔥", "Encadena aciertos para ganar una racha: más daño y más XP."],
            ["💡", "Tienes 2 pistas por duelo. Úsalas con cabeza."],
            ["🛡️", "Si fallas o se acaba el tiempo, el guardián te ataca. Si tu vida llega a 0, pierdes el duelo."],
            ["⭐", "Gana hasta 3 estrellas por zona y sube de rango en el ranking."],
          ].map(([i, t], k) => (
            <li key={k} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#be9348]/25 text-lg">{i}</span>
              <span className="pt-1">{t}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-right">
          <GoldButton onClick={() => setModal(null)}>¡Entendido!</GoldButton>
        </div>
      </Modal>

      <Modal open={modal === "rank"} onClose={() => setModal(null)} title="🏆 Ranking del reino">
        {ranking === null ? (
          <p className="animate-pulse py-6 text-center">Consultando los pergaminos…</p>
        ) : ranking.length === 0 ? (
          <p className="py-6 text-center text-[#cdbf9c]">Aún no hay héroes en el ranking. ¡Sé el primero!</p>
        ) : (
          <ol className="space-y-2">
            {ranking.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${p.id === save.player?.id ? "bg-[#be9348]/30" : "bg-white/5"}`}
              >
                <span className="font-title w-8 text-center text-lg font-extrabold">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <span className="flex-1 truncate font-bold">{p.name}</span>
                <span className="text-sm">⭐ {p.stars}</span>
                <span className="font-title w-20 text-right font-bold text-[var(--gold)]">{p.xp} XP</span>
              </motion.li>
            ))}
          </ol>
        )}
      </Modal>

      <Modal open={modal === "options"} onClose={() => setModal(null)} title="⚙️ Opciones">
        <div className="space-y-3">
          {(
            [
              ["muted", "🔇 Silenciar todo", sound.muted],
              ["music", "🎵 Música", sound.music],
              ["voice", "🗣️ Voz en inglés (ejercicios de escucha)", sound.voice],
            ] as const
          ).map(([k, label, v]) => (
            <label key={k} className="flex cursor-pointer items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span>{label}</span>
              <input
                type="checkbox"
                className="h-6 w-6 accent-[#e0aa4b]"
                checked={v}
                onChange={(e) => setSettings({ [k]: e.target.checked })}
              />
            </label>
          ))}
          {save.player && (
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="mb-2 text-sm text-[#cdbf9c]">
                Jugando como <strong>{save.player.name}</strong>
              </p>
              <GoldButton variant="danger" onClick={() => { logout(); setModal(null); }}>
                Cambiar de héroe
              </GoldButton>
            </div>
          )}
        </div>
        <div className="mt-6 text-right">
          <GoldButton onClick={() => setModal(null)}>Listo</GoldButton>
        </div>
      </Modal>

      <Modal open={modal === "name"} onClose={() => setModal(null)} title="🛡️ ¿Cómo te llamas, héroe?">
        <form onSubmit={submitName} className="space-y-4">
          <p className="text-[#cdbf9c]">Tu nombre aparecerá en el ranking y guardaremos tu progreso.</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="Tu nombre"
            className="w-full rounded-xl border-2 border-[#be9348] bg-[#0b1325] px-4 py-3 text-lg text-white outline-none focus:border-[var(--gold)]"
          />
          <div className="flex justify-end gap-3">
            <GoldButton variant="ghost" onClick={() => setModal(null)}>Cancelar</GoldButton>
            <GoldButton type="submit" disabled={name.trim().length < 2 || saving}>
              {saving ? "Guardando…" : "¡A la aventura!"}
            </GoldButton>
          </div>
        </form>
      </Modal>

      <Portal active={travelling} onDone={goMap} />
    </main>
  );
}
