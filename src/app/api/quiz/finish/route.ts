import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XP_RULES, sameDay } from "@/lib/xp";

const schema = z.object({ quizId: z.string() });

// Demo-scaled thresholds — see README for the full-spec numbers (e.g. 500 for Math Machine).
const ACHIEVEMENT_CHECKS: Record<string, (s: Stats) => boolean> = {
  first_blood: (s) => s.totalQuestions >= 1,
  speed_demon: (s) => s.fastCorrect >= 5,
  perfect_run: (s) => s.perfectRuns >= 1,
  grinder: (s) => s.totalQuestions >= 25,
  math_machine: (s) => (s.categoryCount["Quantitative Aptitude"] ?? 0) >= 15,
  logic_lord: (s) => (s.categoryCount["Logical Reasoning"] ?? 0) >= 15,
  unstoppable: (s) => s.streak >= 3,
  placement_ready: (s) => Object.keys(s.categoryCount).length >= 3,
};

type Stats = {
  totalQuestions: number;
  fastCorrect: number;
  perfectRuns: number;
  categoryCount: Record<string, number>;
  streak: number;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Missing quizId." }, { status: 400 });
  const { quizId } = parsed.data;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { attempts: true } });
  if (!quiz || quiz.userId !== userId) return NextResponse.json({ error: "Not your quiz." }, { status: 403 });
  if (quiz.finishedAt) return NextResponse.json({ error: "Quiz already finished." }, { status: 409 });

  const attempts = quiz.attempts;
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length ? Math.round((correctCount / attempts.length) * 100) : 0;
  const baseXp = attempts.reduce((sum, a) => sum + a.xpEarned, 0);

  let bonusXp = 0;
  let bonusCoins = 0;
  const bonuses: string[] = [];

  if (accuracy === 100 && attempts.length >= 5) {
    bonusXp += XP_RULES.PERFECT_QUIZ_BONUS;
    bonuses.push(`Perfect quiz +${XP_RULES.PERFECT_QUIZ_BONUS} XP`);
    await prisma.user.update({ where: { id: userId }, data: {} }); // placeholder for perfectRuns counter if added later
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();
  if (quiz.mode === "DAILY_CHALLENGE" && (!user?.lastDailyChallenge || !sameDay(user.lastDailyChallenge, now))) {
    bonusXp += XP_RULES.DAILY_CHALLENGE_BONUS;
    bonusCoins += XP_RULES.DAILY_CHALLENGE_COINS;
    bonuses.push(`Daily challenge +${XP_RULES.DAILY_CHALLENGE_BONUS} XP, +${XP_RULES.DAILY_CHALLENGE_COINS} coins`);
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { finishedAt: now, xpEarned: baseXp + bonusXp, accuracy },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXP: { increment: bonusXp },
      coins: { increment: bonusCoins },
      ...(quiz.mode === "DAILY_CHALLENGE" ? { lastDailyChallenge: now } : {}),
    },
  });

  // Achievement check against aggregate stats.
  const [totalQuestions, fastCorrect, perfectQuizzes, streakVal] = await Promise.all([
    prisma.attempt.count({ where: { userId } }),
    prisma.attempt.count({ where: { userId, correct: true, timeTakenMs: { lt: XP_RULES.FAST_THRESHOLD_MS } } }),
    prisma.quiz.count({ where: { userId, accuracy: 100 } }),
    Promise.resolve(updatedUser.currentStreak),
  ]);
  const categoryRows = await prisma.attempt.findMany({
    where: { userId },
    select: { question: { select: { category: { select: { name: true } } } } },
  });
  const categoryCount: Record<string, number> = {};
  for (const row of categoryRows) {
    const name = row.question.category.name;
    categoryCount[name] = (categoryCount[name] ?? 0) + 1;
  }
  const stats: Stats = { totalQuestions, fastCorrect, perfectRuns: perfectQuizzes, categoryCount, streak: streakVal };

  const already = await prisma.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { key: true } } } });
  const alreadyKeys = new Set(already.map((a) => a.achievement.key));
  const newlyUnlocked: string[] = [];

  for (const [key, check] of Object.entries(ACHIEVEMENT_CHECKS)) {
    if (!alreadyKeys.has(key) && check(stats)) {
      const achievement = await prisma.achievement.findUnique({ where: { key } });
      if (achievement) {
        await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        await prisma.user.update({ where: { id: userId }, data: { totalXP: { increment: achievement.xpReward } } });
        newlyUnlocked.push(key);
      }
    }
  }

  return NextResponse.json({
    accuracy,
    correctCount,
    totalQuestions: attempts.length,
    baseXp,
    bonusXp,
    bonusCoins,
    bonuses,
    totalXP: updatedUser.totalXP + newlyUnlocked.length * 0, // achievements already applied above
    newlyUnlocked,
  });
}
