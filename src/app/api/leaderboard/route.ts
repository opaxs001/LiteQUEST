import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { levelProgress, players } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: players.id,
        name: players.name,
        xp: players.xp,
        stars: sql<number>`coalesce(sum(${levelProgress.stars}), 0)::int`,
        zones: sql<number>`count(${levelProgress.id}) filter (where ${levelProgress.wins} > 0)::int`,
      })
      .from(players)
      .leftJoin(levelProgress, sql`${levelProgress.playerId} = ${players.id}`)
      .groupBy(players.id)
      .orderBy(desc(players.xp))
      .limit(10);
    return NextResponse.json({ ranking: rows });
  } catch {
    return NextResponse.json({ ranking: [] }, { status: 200 });
  }
}
