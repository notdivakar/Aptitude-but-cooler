import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

export default async function LeaderboardPage() {
  const sessionUser = await getCurrentUser();
  const userId = (sessionUser as { id: string }).id;

  const top = await prisma.user.findMany({
    orderBy: { totalXP: "desc" },
    take: 50,
    select: { id: true, name: true, totalXP: true, image: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink">Leaderboard</h1>
        <p className="text-mute text-sm mt-1.5">
          All-time XP across every AptiQuest account.{" "}
          <span className="text-faint">
            TODO: weekly/monthly/college/friends views (spec §30) still need dedicated LeaderboardEntry rollups.
          </span>
        </p>
      </div>
      <Card className="p-2">
        {top.length === 0 && <p className="text-mute text-sm p-4">No one's on the board yet — be the first.</p>}
        {top.map((row, i) => {
          const isUser = row.id === userId;
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl ${isUser ? "bg-violet/10 border border-violet" : ""}`}
            >
              <span className={`w-6.5 w-7 text-center font-mono font-bold text-sm ${i === 0 ? "text-gold" : i === 1 ? "text-[#C7CBDB]" : i === 2 ? "text-[#C98A4C]" : "text-faint"}`}>
                {i + 1}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs ${isUser ? "bg-violet text-white" : "bg-surfacehi text-mute"}`}>
                {(row.name ?? "?").split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </div>
              <span className={`flex-1 text-sm ${isUser ? "font-bold text-ink" : "font-medium text-ink"}`}>
                {row.name}{isUser ? " (you)" : ""}
              </span>
              <span className="font-mono font-bold text-sm text-gold">{row.totalXP.toLocaleString()} XP</span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
