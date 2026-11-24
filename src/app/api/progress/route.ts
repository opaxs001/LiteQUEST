import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { levelProgress, players } from "@/db/schema";

export const dynamic = "force-dynamic";

type Body = {
  playerId: string;
  level: number;
  won: boolean;
  score: number;
  stars: number;
  accuracy: number;
  xp: number;
};

const clamp = (n: unknown, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(Number(n) || 0)));

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    const level = clamp(b.level, 1, 4);
    const stars = b.won ? clamp(b.stars, 1, 3) : 0;
    const score = clamp(b.score, 0, 5000);
    const accuracy = clamp(b.accuracy, 0, 100);
    const xp = clamp(b.xp, 0, 1000);

    const [player] = await db.select().from(players).where(eq(players.id, b.playerId));
    if (!player) return NextResponse.json({ error: "jugador no encontrado" }, { status: 404 });

    const [existing] = await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.playerId, player.id), eq(levelProgress.level, level)));

    if (existing) {
      await db
        .update(levelProgress)
        .set({
          stars: Math.max(existing.stars, stars),
          bestScore: Math.max(existing.bestScore, score),
          bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
          attempts: existing.attempts + 1,
          wins: existing.wins + (b.won ? 1 : 0),
          updatedAt: new Date(),
        })
        .where(eq(levelProgress.id, existing.id));
    } else {
      await db.insert(levelProgress).values({
        playerId: player.id,
        level,
        stars,
        bestScore: score,
        bestAccuracy: accuracy,
        attempts: 1,
        wins: b.won ? 1 : 0,
      });
    }

    await db
      .update(players)
      .set({ xp: sql`${players.xp} + ${xp}` })
      .where(eq(players.id, player.id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });
  }
}
