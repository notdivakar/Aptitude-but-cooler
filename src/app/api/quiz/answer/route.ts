import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XP_RULES, isYesterday, sameDay } from "@/lib/xp";

const schema = z.object({
  quizId: z.string(),
  questionId: z.string(),
  selectedAnswer: z.any(),
  timeTakenMs: z.number().int().min(0),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Malformed answer payload." }, { status: 400 });
  const { quizId, questionId, selectedAnswer, timeTakenMs } = parsed.data;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.userId !== userId) {
    return NextResponse.json({ error: "That quiz session doesn't belong to you." }, { status: 403 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return NextResponse.json({ error: "Question not found." }, { status: 404 });

  // Server is the single source of truth for correctness.
  const correct = JSON.stringify(selectedAnswer) === JSON.stringify(question.correctAnswer);

  let xpEarned = 0;
  if (correct) {
    xpEarned += XP_RULES.CORRECT;
    if (timeTakenMs < XP_RULES.FAST_THRESHOLD_MS) xpEarned += XP_RULES.FAST_BONUS;
  }

  await prisma.attempt.create({
    data: {
      userId,
      questionId,
      quizId,
      selectedAnswer,
      correct,
      timeTakenMs,
      difficulty: question.difficulty,
      xpEarned,
    },
  });

  // Topic mastery: weighted by accuracy and volume, capped at 100.
  const progress = await prisma.topicProgress.upsert({
    where: { userId_topicId: { userId, topicId: question.topicId } },
    create: {
      userId,
      topicId: question.topicId,
      attempts: 1,
      correct: correct ? 1 : 0,
      masteryPct: correct ? 20 : 5,
      lastPracticed: new Date(),
    },
    update: {
      attempts: { increment: 1 },
      correct: { increment: correct ? 1 : 0 },
      lastPracticed: new Date(),
    },
  });
  const accRatio = progress.correct / Math.max(progress.attempts, 1);
  const volumeFactor = Math.min(progress.attempts / 20, 1); // mastery needs both accuracy and reps
  const masteryPct = Math.round(accRatio * 70 + volumeFactor * 30);
  await prisma.topicProgress.update({
    where: { userId_topicId: { userId, topicId: question.topicId } },
    data: { masteryPct },
  });

  // Streak + daily counters, only advanced once per day.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();
  let streakUpdate: Record<string, unknown> = {};
  if (!user?.lastActiveDate || !sameDay(user.lastActiveDate, now)) {
    const newStreak = user?.lastActiveDate && isYesterday(user.lastActiveDate, now) ? (user.currentStreak ?? 0) + 1 : 1;
    streakUpdate = {
      currentStreak: newStreak,
      longestStreak: Math.max(user?.longestStreak ?? 0, newStreak),
      lastActiveDate: now,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totalXP: { increment: xpEarned },
      ...streakUpdate,
    },
  });

  return NextResponse.json({
    correct,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    xpEarned,
    totalXP: updatedUser.totalXP,
    streak: updatedUser.currentStreak,
    masteryPct,
  });
}
