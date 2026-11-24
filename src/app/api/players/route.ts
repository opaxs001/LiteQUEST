import { NextResponse } from "next/server";
import { db } from "@/db";
import { players } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string };
    const name = (body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    if (name.length < 2) {
      return NextResponse.json({ error: "El nombre debe tener al menos 2 letras." }, { status: 400 });
    }
    const [player] = await db.insert(players).values({ name }).returning();
    return NextResponse.json({ id: player.id, name: player.name, xp: player.xp });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el jugador." }, { status: 500 });
  }
}
