export function normalizar(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .replace(/[‘’`]/g, "'")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/[.?!]+$/, "")
    .trimEnd()
    .replace(/\s+/g, " ");
}

export function igual(a: string, b: string) {
  return normalizar(a) === normalizar(b);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Baraja evitando que quede en el orden original. */
export function shuffleDistinct<T>(arr: T[]): T[] {
  if (arr.length < 2) return arr;
  for (let i = 0; i < 6; i++) {
    const s = shuffle(arr);
    if (s.some((x, k) => x !== arr[k])) return s;
  }
  return [...arr].reverse();
}
