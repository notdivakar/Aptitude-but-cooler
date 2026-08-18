import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Pill } from "@/components/ui";
import { MistakesActions } from "./mistakes-actions";

export default async function MistakesPage() {
  const sessionUser = await getCurrentUser();
  const userId = (sessionUser as { id: string }).id;

  const wrongAttempts = await prisma.attempt.findMany({
    where: { userId, correct: false },
    distinct: ["questionId"],
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { question: { include: { topic: true, category: true } } },
  });

  if (wrongAttempts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display font-extrabold text-2xl text-ink">Mistakes</h1>
        <Card className="p-10 text-center">
          <div className="text-3xl mb-3">🎯</div>
          <p className="font-display font-bold text-ink">No mistakes yet</p>
          <p className="text-mute text-sm mt-2 max-w-xs mx-auto">
            Keep practicing — we'll save every question you get wrong here so you can master it later.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink">Mistakes</h1>
          <p className="text-mute text-sm mt-1.5">{wrongAttempts.length} saved</p>
        </div>
        <MistakesActions count={wrongAttempts.length} />
      </div>

      <div className="flex flex-col gap-3">
        {wrongAttempts.map((a) => {
          const options = a.question.options as string[];
          const selected = a.selectedAnswer as number;
          const correct = a.question.correctAnswer as number;
          return (
            <Card key={a.id} className="p-4.5 p-5">
              <Pill className="bg-violet/10 text-violet">{a.question.topic.name}</Pill>
              <p className="text-ink text-sm my-2.5">{a.question.question}</p>
              <div className="flex gap-5 text-xs flex-wrap">
                <span className="text-bad">You answered: {options[selected]}</span>
                <span className="text-good">Correct: {options[correct]}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
