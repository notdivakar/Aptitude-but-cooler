import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  mode: z.enum(["PRACTICE", "SPEED_RUN", "EXAM", "DAILY_CHALLENGE", "BOSS_BATTLE", "WEAKNESS", "MISTAKES_REVIEW"]),
  categorySlug: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]).optional(),
  count: z.number().int().min(1).max(30).default(5),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "That practice configuration isn't valid." }, { status: 400 });
  }
  const { mode, categorySlug, topicId, difficulty, count } = parsed.data;

  let questionIds: string[] = [];

  if (mode === "MISTAKES_REVIEW") {
    const mistakes = await prisma.attempt.findMany({
      where: { userId, correct: false },
      distinct: ["questionId"],
      orderBy: { createdAt: "desc" },
      take: count,
      select: { questionId: true },
    });
    questionIds = mistakes.map((m) => m.questionId);
  } else if (mode === "WEAKNESS") {
    const weak = await prisma.topicProgress.findMany({
      where: { userId, attempts: { gte: 2 } },
      orderBy: { masteryPct: "asc" },
      take: 1,
    });
    const topicId = weak[0]?.topicId;
    const pool = await prisma.question.findMany({
      where: { reviewStatus: "APPROVED", ...(topicId ? { topicId } : {}) },
      select: { id: true },
      take: 200,
    });
    questionIds = shuffle(pool.map((p) => p.id)).slice(0, count);
  } else {
    const where: Record<string, unknown> = { reviewStatus: "APPROVED" };
    if (categorySlug) where.category = { slug: categorySlug };
    if (topicId) where.topicId = topicId;
    if (mode === "BOSS_BATTLE") where.difficulty = "HARD";
    else if (difficulty && difficulty !== "MIXED") where.difficulty = difficulty;

    const pool = await prisma.question.findMany({ where, select: { id: true }, take: 500 });
    if (pool.length === 0) {
      return NextResponse.json({ error: "No questions match that filter yet." }, { status: 404 });
    }
    const shuffled = shuffle(pool.map((p) => p.id));
    // Sample with repetition if the demo bank is smaller than the requested count.
    questionIds = Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
  }

  if (questionIds.length === 0) {
    return NextResponse.json({ error: "Nothing to practice here yet — try a different filter." }, { status: 404 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      userId,
      mode,
      questions: {
        create: questionIds.map((questionId, order) => ({ questionId, order })),
      },
    },
  });

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, question: true, options: true, difficulty: true, type: true, topic: { select: { name: true } }, category: { select: { name: true, slug: true } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  return NextResponse.json({
    quizId: quiz.id,
    mode,
    questions: questionIds.map((id) => byId.get(id)).filter(Boolean),
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
