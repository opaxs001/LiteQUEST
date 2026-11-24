import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { levelProgress, players } from "@/db/schema";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  try {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    if (!player) return NextResponse.json({ error: "no encontrado" }, { status: 404 });
    const levels = await db.select().from(levelProgress).where(eq(levelProgress.playerId, id));
    return NextResponse.json({
      player: { id: player.id, name: player.name, xp: player.xp },
      levels: levels.map((l) => ({
        level: l.level,
        stars: l.stars,
        bestScore: l.bestScore,
        bestAccuracy: l.bestAccuracy,
        attempts: l.attempts,
        wins: l.wins,
      })),
    });
  } catch {
    return NextResponse.json({ error: "error de base de datos" }, { status: 500 });
  }
}
