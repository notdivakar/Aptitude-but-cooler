import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelFromXP, xpForLevel } from "@/lib/xp";
import { Card, Bar } from "@/components/ui";
import { LevelRing } from "@/components/level-ring";
import { Flame, Target, Zap, Coins, ArrowRight } from "lucide-react";

const DAILY_GOAL = 10;

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser();
  const user = await prisma.user.findUnique({ where: { id: (sessionUser as { id: string }).id } });
  if (!user) return null;

  const [totalQuestions, totalCorrect] = await Promise.all([
    prisma.attempt.count({ where: { userId: user.id } }),
    prisma.attempt.count({ where: { userId: user.id, correct: true } }),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const dailyDone = await prisma.attempt.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } });

  const weakTopics = await prisma.topicProgress.findMany({
    where: { userId: user.id, attempts: { gte: 2 } },
    orderBy: { masteryPct: "asc" },
    take: 1,
    include: { topic: true },
  });
  const recommended = weakTopics[0];

  const level = levelFromXP(user.totalXP);
  const xpAtLevel = xpForLevel(level);
  const xpAtNext = xpForLevel(level + 1);
  const xpInLevel = user.totalXP - xpAtLevel;
  const xpNeeded = xpAtNext - xpAtLevel;
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const dailyRemaining = Math.max(0, DAILY_GOAL - dailyDone);

  const today = new Date().toISOString().slice(0, 10);
  const canDaily = !user.lastDailyChallenge || user.lastDailyChallenge.toISOString().slice(0, 10) !== today;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink">{greeting}, {user.name?.split(" ")[0] ?? "there"} 👋</h1>
        <p className="text-mute text-sm mt-1.5">Ready to level up?</p>
      </div>

      <Card className="p-6 flex items-center gap-6 flex-wrap">
        <LevelRing level={level} xpInLevel={xpInLevel} xpNeeded={xpNeeded} />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="font-mono font-bold text-xl text-ink">{user.totalXP.toLocaleString()} XP</span>
            <span className="text-faint text-xs">total</span>
          </div>
          <Bar value={xpInLevel} max={xpNeeded} colorClass="bg-gradient-to-r from-violet to-gold" height={12} />
          <p className="text-mute text-xs mt-2">{Math.max(0, xpNeeded - xpInLevel)} XP to Level {level + 1}</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatChip icon={Flame} colorClass="text-gold" label="Day streak" value={user.currentStreak} />
        <StatChip icon={Target} colorClass="text-good" label="Accuracy" value={`${accuracy}%`} />
        <StatChip icon={Zap} colorClass="text-violet" label="Questions" value={totalQuestions} />
        <StatChip icon={Coins} colorClass="text-gold" label="Coins" value={user.coins} />
      </div>

      <Card className="p-5.5 p-6">
        <div className="flex justify-between items-center mb-3.5">
          <span className="font-display font-bold text-sm text-ink">Today's goal</span>
          <span className="font-mono text-xs text-mute">{dailyDone} / {DAILY_GOAL}</span>
        </div>
        <Bar value={dailyDone} max={DAILY_GOAL} colorClass="bg-good" height={12} />
        <div className="flex justify-between items-center mt-3.5">
          <span className="text-mute text-xs">
            {dailyRemaining === 0 ? "Goal complete for today" : `${dailyRemaining} question${dailyRemaining === 1 ? "" : "s"} remaining`}
          </span>
          <Link href="/practice" className="inline-flex items-center gap-1.5 bg-gradient-to-br from-violet to-violet-dim text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            Continue <ArrowRight size={15} />
          </Link>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-violet/10 to-surface">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={17} className="text-gold" />
            <span className="font-display font-bold text-sm text-ink">Daily challenge</span>
          </div>
          <p className="text-mute text-xs mb-4">5 mixed questions · reward +100 XP, +25 coins</p>
          <Link
            href={canDaily ? "/practice?daily=1" : "#"}
            className={`block text-center font-semibold text-sm rounded-xl py-3 ${
              canDaily ? "bg-gradient-to-br from-gold to-gold-dim text-[#1A1200]" : "bg-surfacehi text-faint pointer-events-none"
            }`}
          >
            {canDaily ? "Start challenge" : "Completed today"}
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Target size={17} className="text-good" />
            <span className="font-display font-bold text-sm text-ink">Recommended</span>
          </div>
          {recommended ? (
            <>
              <p className="text-mute text-xs mb-4">
                You're at {recommended.masteryPct}% mastery on <strong className="text-ink font-semibold">{recommended.topic.name}</strong>. A short focused set can help.
              </p>
              <Link href={`/practice?topicId=${recommended.topicId}`} className="block text-center bg-surfacehi border border-border text-ink font-semibold text-sm rounded-xl py-3">
                Practice {recommended.topic.name}
              </Link>
            </>
          ) : (
            <>
              <p className="text-mute text-xs mb-4">Answer a few questions and we'll start spotting your weak topics here.</p>
              <Link href="/practice" className="block text-center bg-surfacehi border border-border text-ink font-semibold text-sm rounded-xl py-3">
                Browse topics
              </Link>
            </>
          )}
        </Card>
      </div>
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
