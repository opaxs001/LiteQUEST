"use client";
import { useSyncExternalStore } from "react";

// Gestor de audio global: música con fundido, efectos y voz (Web Speech API).

type Settings = { muted: boolean; music: boolean; voice: boolean };

let settings: Settings = { muted: false, music: true, voice: true };
let loaded = false;
const listeners = new Set<() => void>();
let music: HTMLAudioElement | null = null;
let musicPath = "";
let musicVol = 0.5;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let unlocked = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem("eq-sound");
    if (raw) settings = { ...settings, ...JSON.parse(raw) };
  } catch {}
}

function emit() {
  listeners.forEach((l) => l());
}

export function getSettings() {
  load();
  return settings;
}

export function setSettings(patch: Partial<Settings>) {
  load();
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem("eq-sound", JSON.stringify(settings));
  } catch {}
  if (music) {
    music.volume = settings.muted || !settings.music ? 0 : musicVol;
    if (settings.muted || !settings.music) music.pause();
    else music.play().catch(() => {});
  }
  if (settings.muted && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  emit();
}

const serverSnapshot: Settings = { muted: false, music: true, voice: true };
export function useSoundSettings() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => getSettings(),
    () => serverSnapshot,
  );
}

function fadeTo(el: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  if (fadeTimer) clearInterval(fadeTimer);
  const steps = Math.max(1, Math.round(ms / 50));
  const start = el.volume;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    el.volume = Math.max(0, Math.min(1, start + ((target - start) * i) / steps));
    if (i >= steps) {
      if (fadeTimer) clearInterval(fadeTimer);
      fadeTimer = null;
      done?.();
    }
  }, 50);
}

export function playMusic(path: string, vol = 0.5) {
  load();
  if (typeof window === "undefined") return;
  if (music && musicPath === path) return;
  const old = music;
  if (old) {
    const o = old;
    o.pause();
  }
  musicPath = path;
  musicVol = vol;
  const a = new Audio(path);
  a.loop = true;
  a.volume = 0;
  music = a;
  if (settings.muted || !settings.music) return;
  const start = () => {
    a.play()
      .then(() => fadeTo(a, vol, 1200))
      .catch(() => {});
  };
  start();
}

/** Los navegadores bloquean el audio hasta la primera interacción. */
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  if (music && !settings.muted && settings.music) {
    music.play().then(() => fadeTo(music!, musicVol, 1200)).catch(() => {});
  }
}

export function stopMusic() {
  if (music) {
    const m = music;
    music = null;
    musicPath = "";
    fadeTo(m, 0, 500, () => m.pause());
  }
}

export function sfx(path: string, vol = 0.7) {
  load();
  if (typeof window === "undefined" || settings.muted) return;
  const a = new Audio(path);
  a.volume = vol;
  a.play().catch(() => {});
}

export const click = () => sfx("/audio/boton.mp3", 0.5);

export function speak(text: string, rate = 0.9) {
  load();
  if (typeof window === "undefined" || !("speechSynthesis" in window) || settings.muted) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  if (voices[0]) u.voice = voices.find((v) => v.lang === "en-US") ?? voices[0];
  speechSynthesis.speak(u);
  return true;
}
