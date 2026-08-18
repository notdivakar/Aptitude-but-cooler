import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelFromXP } from "@/lib/xp";
import { Card, Bar } from "@/components/ui";
import { Target, Zap, Flame, Trophy, Lock } from "lucide-react";

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  const userId = (sessionUser as { id: string }).id;

  const [user, totalQuestions, totalCorrect, allAchievements, unlocked, topicProgress] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.attempt.count({ where: { userId } }),
    prisma.attempt.count({ where: { userId, correct: true } }),
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    prisma.topicProgress.findMany({ where: { userId }, include: { topic: true }, orderBy: { masteryPct: "desc" } }),
  ]);
  if (!user) return null;

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const level = levelFromXP(user.totalXP);
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  function masteryLabel(pct: number, attempts: number) {
    if (attempts === 0) return { label: "Not started", cls: "text-faint" };
    if (attempts < 3) return { label: "Learning", cls: "text-mute" };
    if (pct < 50) return { label: "Familiar", cls: "text-gold" };
    if (pct < 80) return { label: "Strong", cls: "text-good" };
    return { label: "Mastered", cls: "text-violet" };
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 flex items-center gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet to-gold flex items-center justify-center font-display font-extrabold text-xl text-bg">
          {user.name?.[0] ?? "?"}
        </div>
        <div>
          <div className="font-display font-bold text-lg text-ink">{user.name}</div>
          <div className="text-mute text-sm mt-0.5">Level {level} · {user.totalXP.toLocaleString()} XP</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatChip icon={Target} colorClass="text-good" label="Accuracy" value={`${accuracy}%`} />
        <StatChip icon={Zap} colorClass="text-violet" label="Solved" value={totalQuestions} />
        <StatChip icon={Flame} colorClass="text-gold" label="Best streak" value={user.longestStreak} />
        <StatChip icon={Trophy} colorClass="text-gold" label="Achievements" value={`${unlockedIds.size}/${allAchievements.length}`} />
      </div>

      <Card className="p-6">
        <span className="font-display font-bold text-sm text-ink">Achievements</span>
        <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {allAchievements.map((a) => {
            const isUnlocked = unlockedIds.has(a.id);
            return (
              <div key={a.id} className={`flex gap-3 p-3.5 rounded-xl border ${isUnlocked ? "bg-gold/10 border-gold/30" : "bg-white/[0.02] border-border"}`}>
                <div className={`w-9.5 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isUnlocked ? "bg-gold" : "bg-surfacehi"}`}>
                  {isUnlocked ? <Trophy size={18} className="text-[#1A1200]" /> : <Lock size={16} className="text-faint" />}
                </div>
                <div>
                  <div className={`font-bold text-sm ${isUnlocked ? "text-ink" : "text-mute"}`}>{a.name}</div>
                  <div className="text-faint text-[11px] mt-0.5">{a.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <span className="font-display font-bold text-sm text-ink">Topic mastery</span>
        {topicProgress.length === 0 ? (
          <p className="text-mute text-sm mt-3">Practice a few topics to see mastery build up here.</p>
        ) : (
          <div className="flex flex-col gap-3.5 mt-4">
            {topicProgress.map((tp) => {
              const m = masteryLabel(tp.masteryPct, tp.attempts);
              return (
                <div key={tp.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-ink">{tp.topic.name}</span>
                    <span className={`font-semibold ${m.cls}`}>{m.label} · {Math.round(tp.masteryPct)}%</span>
                  </div>
                  <Bar value={tp.masteryPct} max={100} colorClass="bg-violet" height={7} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatChip({ icon: Icon, colorClass, label, value }: { icon: React.ElementType; colorClass: string; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <Icon size={18} className={colorClass} />
      <div className="font-mono font-bold text-xl text-ink mt-2">{value}</div>
      <div className="text-mute text-[11px] mt-0.5">{label}</div>
    </Card>
  );
}
