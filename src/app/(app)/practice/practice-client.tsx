"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Target, Brain, MessageSquare, ArrowRight, ChevronLeft, Clock, Check, X,
  Zap, Sword, ListChecks, RotateCcw, Award, Sparkles,
} from "lucide-react";
import { Card, Bar, Pill } from "@/components/ui";

type Topic = { id: string; name: string; slug: string };
type Category = { id: string; name: string; slug: string; topics: Topic[] };

const CATEGORY_META: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  "Quantitative Aptitude": { icon: Target, colorClass: "text-violet", bgClass: "bg-violet/10" },
  "Logical Reasoning": { icon: Brain, colorClass: "text-gold", bgClass: "bg-gold/10" },
  "Verbal Ability": { icon: MessageSquare, colorClass: "text-good", bgClass: "bg-good/10" },
};
const DEFAULT_META = { icon: Target, colorClass: "text-violet", bgClass: "bg-violet/10" };

type ApiQuestion = {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  topic: { name: string };
  category: { name: string; slug: string };
};

export function PracticeClient({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<"picker" | "quiz" | "results">("picker");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);

  const initialTopicId = searchParams.get("topicId") ?? undefined;
  const isDaily = searchParams.get("daily") === "1";
  const isMistakes = searchParams.get("mistakes") === "1";

  useEffect(() => {
    if (isDaily) start({ mode: "DAILY_CHALLENGE", count: 5 });
    else if (isMistakes) start({ mode: "MISTAKES_REVIEW", count: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start(body: Record<string, unknown>) {
    setStarting(true);
    setError("");
    const res = await fetch("/api/quiz/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setStarting(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't start that session.");
      return;
    }
    setQuizId(data.quizId);
    setQuestions(data.questions);
    setStage("quiz");
  }

  function handleFinish(summary: Record<string, unknown>) {
    setResults(summary);
    setStage("results");
  }

  if (stage === "quiz" && quizId) {
    return (
      <QuizRunner
        quizId={quizId}
        questions={questions}
        onFinish={handleFinish}
        onExit={() => setStage("picker")}
      />
    );
  }

  if (stage === "results" && results) {
    return (
      <Results
        summary={results}
        onDone={() => setStage("picker")}
      />
    );
  }

  return (
    <Picker
      categories={categories}
      initialTopicId={initialTopicId}
      onStart={start}
      error={error}
      starting={starting}
    />
  );
}

/* ---------------- Picker ---------------- */

function Picker({
  categories, initialTopicId, onStart, error, starting,
}: {
  categories: Category[];
  initialTopicId?: string;
  onStart: (body: Record<string, unknown>) => void;
  error: string;
  starting: boolean;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id);
  const [topicId, setTopicId] = useState<string | undefined>(initialTopicId);
  const [difficulty, setDifficulty] = useState("MIXED");
  const [count, setCount] = useState(5);

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink">Practice</h1>
        <p className="text-mute text-sm mt-1.5">Pick a category and build a custom set.</p>
      </div>

      {error && <Card className="p-4 bg-bad/10 border-bad/30 text-bad text-sm">{error}</Card>}

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat.name] ?? DEFAULT_META;
          const active = categoryId === cat.id;
          return (
            <Card
              key={cat.id}
              className={`p-4.5 p-4 cursor-pointer ${active ? `border-violet ${meta.bgClass}` : ""}`}
            >
              <button
                onClick={() => { setCategoryId(cat.id); setTopicId(undefined); }}
                className="w-full text-left"
              >
                <meta.icon size={20} className={meta.colorClass} />
                <div className="font-display font-bold text-sm text-ink mt-2.5">{cat.name}</div>
                <div className="text-mute text-xs mt-1">{cat.topics.length} topics</div>
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 flex flex-col gap-4.5 gap-5">
        <div>
          <Label>Topic</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            <Chip active={!topicId} onClick={() => setTopicId(undefined)}>All topics</Chip>
            {activeCategory?.topics.map((t) => (
              <Chip key={t.id} active={topicId === t.id} onClick={() => setTopicId(t.id)}>{t.name}</Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Difficulty</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["EASY", "MEDIUM", "HARD", "MIXED"].map((d) => (
              <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>{d[0] + d.slice(1).toLowerCase()}</Chip>
            ))}
          </div>
        </div>
        <div>
          <Label>Questions</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[5, 10, 15].map((n) => (
              <Chip key={n} active={count === n} onClick={() => setCount(n)}>{n}</Chip>
            ))}
          </div>
        </div>
        <button
          disabled={starting}
          onClick={() => onStart({ mode: "PRACTICE", categorySlug: activeCategory?.slug, topicId, difficulty, count })}
          className="w-full bg-gradient-to-br from-violet to-violet-dim text-white font-semibold text-sm rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {starting ? "Loading…" : "Start practice"} <ArrowRight size={15} />
        </button>
      </Card>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <ModeCard icon={Zap} title="Speed run" desc="Fast questions, speed-weighted score." colorClass="text-gold"
          onClick={() => onStart({ mode: "SPEED_RUN", categorySlug: activeCategory?.slug, count: 8 })} />
        <ModeCard icon={Sword} title="Boss battle" desc="Hardest questions in this category." colorClass="text-bad"
          onClick={() => onStart({ mode: "BOSS_BATTLE", categorySlug: activeCategory?.slug, count: 5 })} />
        <ModeCard icon={ListChecks} title="Exam mode" desc="No feedback until the end." colorClass="text-violet"
          onClick={() => onStart({ mode: "EXAM", categorySlug: activeCategory?.slug, count: 10 })} />
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-mute text-[11px] font-semibold uppercase tracking-wide">{children}</label>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-xs font-semibold border ${
        active ? "border-violet bg-violet/10 text-violet" : "border-border text-mute"
      }`}
    >
      {children}
    </button>
  );
}

function ModeCard({ icon: Icon, title, desc, colorClass, onClick }: { icon: React.ElementType; title: string; desc: string; colorClass: string; onClick: () => void }) {
  return (
    <Card className="p-4.5 p-4 cursor-pointer">
      <button onClick={onClick} className="w-full text-left">
        <Icon size={19} className={colorClass} />
        <div className="font-display font-bold text-sm text-ink mt-2.5">{title}</div>
        <div className="text-mute text-xs mt-1">{desc}</div>
      </button>
    </Card>
  );
}

/* ---------------- Quiz runner ---------------- */

function QuizRunner({
  quizId, questions, onFinish, onExit,
}: {
  quizId: string;
  questions: ApiQuestion[];
  onFinish: (summary: Record<string, unknown>) => void;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: number; explanation: string; xpEarned: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const isExam = false;

  useEffect(() => {
    setElapsed(0);
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
  }, [idx]);

  const q = questions[idx];

  async function choose(i: number) {
    if (selected !== null || submitting) return;
    setSelected(i);
    setSubmitting(true);
    const res = await fetch("/api/quiz/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, questionId: q.id, selectedAnswer: i, timeTakenMs: elapsed * 1000 }),
    });
    const data = await res.json();
    setSubmitting(false);
    setFeedback({ correct: data.correct, correctAnswer: data.correctAnswer, explanation: data.explanation, xpEarned: data.xpEarned });
  }

  async function next() {
    if (idx + 1 >= questions.length) {
      const res = await fetch("/api/quiz/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });
      const data = await res.json();
      onFinish(data);
    } else {
      setIdx(idx + 1);
      setSelected(null);
      setFeedback(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <button onClick={onExit} className="flex items-center gap-1 text-mute text-xs">
          <ChevronLeft size={16} /> Exit
        </button>
        <span className="font-mono text-xs text-mute">Question {idx + 1} / {questions.length}</span>
        <span className={`flex items-center gap-1.5 font-mono text-xs ${elapsed > 30 ? "text-bad" : "text-mute"}`}>
          <Clock size={14} /> {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>

      <Bar value={idx} max={questions.length} colorClass="bg-violet" height={8} />

      <Card className="p-6">
        <div className="flex gap-2 mb-3.5">
          <Pill className="bg-violet/10 text-violet">{q.topic.name}</Pill>
          <Pill className="bg-white/5 text-mute">{q.difficulty.toLowerCase()}</Pill>
        </div>
        <p className="font-display font-semibold text-lg text-ink leading-relaxed">{q.question}</p>

        <div className="flex flex-col gap-2.5 mt-5.5 mt-6">
          {q.options.map((opt, i) => {
            let state: "idle" | "correct" | "wrong" | "selected" = "idle";
            if (selected !== null && feedback) {
              if (i === feedback.correctAnswer) state = "correct";
              else if (i === selected) state = "wrong";
            }
            const classes = {
              idle: "bg-surfacehi border-border",
              correct: "bg-good/10 border-good",
              wrong: "bg-bad/10 border-bad",
              selected: "",
            }[state];
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={selected !== null}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-left ${classes}`}
              >
                <span className="w-6.5 h-6.5 w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs bg-white/5 text-mute shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-ink text-sm flex-1">{opt}</span>
                {state === "correct" && <Check size={18} className="text-good" />}
                {state === "wrong" && <X size={18} className="text-bad" />}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex items-center gap-2 mb-2.5">
              {feedback.correct ? (
                <>
                  <Check size={18} className="text-good" />
                  <span className="text-good font-bold text-sm">CORRECT</span>
                  <span className="ml-auto font-mono text-gold text-xs font-semibold">+{feedback.xpEarned} XP</span>
                </>
              ) : (
                <>
                  <X size={18} className="text-bad" />
                  <span className="text-bad font-bold text-sm">NOT QUITE</span>
                </>
              )}
            </div>
            <p className="text-mute text-sm leading-relaxed">{feedback.explanation}</p>
            <button onClick={next} className="w-full mt-4.5 mt-5 bg-gradient-to-br from-violet to-violet-dim text-white font-semibold text-sm rounded-xl py-3 flex items-center justify-center gap-2">
              {idx + 1 >= questions.length ? "See results" : "Next question"} <ArrowRight size={15} />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Results ---------------- */

function Results({ summary, onDone }: { summary: Record<string, unknown>; onDone: () => void }) {
  const accuracy = summary.accuracy as number;
  const totalXp = (summary.baseXp as number) + (summary.bonusXp as number);
  const bonuses = summary.bonuses as string[];
  const newlyUnlocked = summary.newlyUnlocked as string[];

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4.5 gap-5 text-center">
      <div className="text-4xl">{accuracy === 100 ? "🏆" : accuracy >= 70 ? "🎯" : "💪"}</div>
      <h1 className="font-display font-extrabold text-2xl text-ink">Session complete</h1>
      <p className="text-mute">{summary.correctCount as number} / {summary.totalQuestions as number} correct · {accuracy}% accuracy</p>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <div className="text-mute text-xs">XP earned</div>
            <div className="font-mono font-bold text-2xl text-gold">+{totalXp}</div>
          </div>
          <div>
            <div className="text-mute text-xs">Accuracy</div>
            <div className="font-mono font-bold text-2xl text-ink">{accuracy}%</div>
          </div>
        </div>
        {bonuses?.length > 0 && (
          <p className="text-good text-xs mt-3">{bonuses.join(" · ")}</p>
        )}
      </Card>

      {newlyUnlocked?.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 justify-center mb-3.5">
            <Award size={18} className="text-gold" />
            <span className="font-display font-bold text-sm text-ink">Achievement unlocked</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {newlyUnlocked.map((key) => (
              <div key={key} className="flex items-center gap-3 px-3.5 py-2.5 bg-gold/10 rounded-xl text-left">
                <Sparkles size={18} className="text-gold" />
                <span className="text-ink text-sm font-semibold">{key.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <button onClick={onDone} className="w-full bg-gradient-to-br from-violet to-violet-dim text-white font-semibold text-sm rounded-xl py-3 flex items-center justify-center gap-2">
        <RotateCcw size={15} /> Back to practice
      </button>
    </div>
  );
}
