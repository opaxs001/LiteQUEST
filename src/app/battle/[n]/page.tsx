import { notFound } from "next/navigation";
import BattleGame from "@/components/battle/BattleGame";
import { NIVELES } from "@/data/levels";

export function generateStaticParams() {
  return NIVELES.map((n) => ({ n: String(n.numero) }));
}

export default async function BattlePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);
  if (!NIVELES.some((x) => x.numero === num)) notFound();
  return <BattleGame numero={num} />;
}
