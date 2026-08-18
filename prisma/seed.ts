import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function contentHash(question: string) {
  const normalized = question.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

const CATEGORIES = [
  { name: "Quantitative Aptitude", order: 0 },
  { name: "Logical Reasoning", order: 1 },
  { name: "Verbal Ability", order: 2 },
] as const;

// Only the topics used by the seed question bank. The full spec hierarchy
// (Section 8) has ~50 topics — add rows here as real content is authored
// or imported.
const TOPICS: Record<string, string[]> = {
  "Quantitative Aptitude": [
    "Percentages", "Profit & Loss", "Time & Work", "Time, Speed & Distance",
    "Averages", "Ratio & Proportion", "Simple Interest", "Probability",
  ],
  "Logical Reasoning": [
    "Number Series", "Blood Relations", "Coding-Decoding", "Syllogisms",
    "Direction Sense", "Calendars",
  ],
  "Verbal Ability": ["Synonyms", "Antonyms", "Sentence Correction", "Error Detection", "Idioms"],
};

const ACHIEVEMENTS = [
  { key: "first_blood", name: "First Blood", description: "Answer your first question.", icon: "sword", xpReward: 50 },
  { key: "speed_demon", name: "Speed Demon", description: "Answer 5 questions correctly in under 10 seconds each.", icon: "zap", xpReward: 50 },
  { key: "perfect_run", name: "Perfect Run", description: "Score 100% in a 5+ question quiz.", icon: "sparkles", xpReward: 50 },
  { key: "grinder", name: "Grinder", description: "Solve 25 questions total.", icon: "dumbbell", xpReward: 50 },
  { key: "math_machine", name: "Math Machine", description: "Solve 15 quantitative questions.", icon: "target", xpReward: 50 },
  { key: "logic_lord", name: "Logic Lord", description: "Solve 15 reasoning questions.", icon: "brain", xpReward: 50 },
  { key: "unstoppable", name: "Unstoppable", description: "Maintain a 3-day streak.", icon: "flame", xpReward: 50 },
  { key: "placement_ready", name: "Placement Ready", description: "Attempt questions from all 3 categories.", icon: "trophy", xpReward: 50 },
];

type SeedQuestion = {
  category: string; topic: string; difficulty: "EASY" | "MEDIUM" | "HARD";
  question: string; options: string[]; correct: number; explanation: string;
};

const QUESTIONS: SeedQuestion[] = [
  { category: "Quantitative Aptitude", topic: "Percentages", difficulty: "EASY",
    question: "A shirt is marked at ₹1,200 and sold at a 15% discount. What is the sale price?",
    options: ["₹1,020", "₹1,080", "₹1,140", "₹960"], correct: 0,
    explanation: "15% of 1200 = 180. Sale price = 1200 − 180 = ₹1,020." },
  { category: "Quantitative Aptitude", topic: "Percentages", difficulty: "MEDIUM",
    question: "In an election, the winner got 55% of votes and won by 4,000 votes. Find the total votes cast.",
    options: ["36,000", "38,000", "40,000", "42,000"], correct: 2,
    explanation: "Winner 55%, loser 45%, gap = 10% = 4000 → total = 4000/0.10 = 40,000." },
  { category: "Quantitative Aptitude", topic: "Percentages", difficulty: "HARD",
    question: "A number is first increased by 20%, then decreased by 20%. What is the net percentage change?",
    options: ["No change", "4% decrease", "4% increase", "2% decrease"], correct: 1,
    explanation: "Net change = 20 − 20 − (20×20)/100 = −4%, i.e. a 4% decrease." },
  { category: "Quantitative Aptitude", topic: "Profit & Loss", difficulty: "EASY",
    question: "A vendor buys apples at ₹20/kg and sells at ₹25/kg. Find the profit percentage.",
    options: ["20%", "25%", "15%", "30%"], correct: 1,
    explanation: "Profit = 5, Profit% = 5/20 × 100 = 25%." },
  { category: "Quantitative Aptitude", topic: "Profit & Loss", difficulty: "MEDIUM",
    question: "A shopkeeper marks goods 40% above cost price and gives a 25% discount. Find his profit percent.",
    options: ["5%", "10%", "15%", "8%"], correct: 0,
    explanation: "Let CP = 100. Marked price = 140. Selling price after 25% discount = 140 × 0.75 = 105. Profit = 105 − 100 = 5, so profit% = 5%." },
  { category: "Quantitative Aptitude", topic: "Time & Work", difficulty: "EASY",
    question: "A can finish a job in 10 days and B in 15 days. Working together, how many days will it take?",
    options: ["5 days", "6 days", "7 days", "8 days"], correct: 1,
    explanation: "Combined rate = 1/10 + 1/15 = 1/6, so together they take 6 days." },
  { category: "Quantitative Aptitude", topic: "Time & Work", difficulty: "MEDIUM",
    question: "A does a job in 12 days, B in 18 days. They work together for 4 days, then A leaves. How many more days does B need?",
    options: ["6", "7", "8", "9"], correct: 2,
    explanation: "Combined rate = 1/12 + 1/18 = 5/36. In 4 days they finish 4×5/36 = 5/9 of the job, leaving 4/9. B alone needs (4/9) ÷ (1/18) = 8 more days." },
  { category: "Quantitative Aptitude", topic: "Time, Speed & Distance", difficulty: "EASY",
    question: "A car covers 180 km in 3 hours. What is its speed in km/h?",
    options: ["50 km/h", "60 km/h", "70 km/h", "45 km/h"], correct: 1,
    explanation: "Speed = Distance/Time = 180/3 = 60 km/h." },
  { category: "Quantitative Aptitude", topic: "Time, Speed & Distance", difficulty: "MEDIUM",
    question: "Two trains 120 m and 180 m long run in opposite directions at 54 km/h and 36 km/h. Time to cross each other?",
    options: ["10 s", "12 s", "14 s", "16 s"], correct: 1,
    explanation: "Relative speed = 90 km/h = 25 m/s. Total length = 300 m. Time = 300/25 = 12 s." },
  { category: "Quantitative Aptitude", topic: "Averages", difficulty: "EASY",
    question: "The average of 5 numbers is 20. If one number is removed, the average becomes 18. What was the removed number?",
    options: ["24", "26", "28", "30"], correct: 2,
    explanation: "Sum of 5 = 100, sum of 4 = 72, removed number = 100 − 72 = 28." },
  { category: "Quantitative Aptitude", topic: "Ratio & Proportion", difficulty: "MEDIUM",
    question: "₹4,800 is divided between A and B in the ratio 5:7. How much does B get?",
    options: ["₹2,000", "₹2,400", "₹2,800", "₹3,200"], correct: 2,
    explanation: "Total parts = 12. B's share = 7/12 × 4800 = ₹2,800." },
  { category: "Quantitative Aptitude", topic: "Simple Interest", difficulty: "EASY",
    question: "Find the simple interest on ₹5,000 at 8% per annum for 3 years.",
    options: ["₹1,000", "₹1,100", "₹1,200", "₹1,300"], correct: 2,
    explanation: "SI = (P×R×T)/100 = (5000×8×3)/100 = ₹1,200." },
  { category: "Quantitative Aptitude", topic: "Probability", difficulty: "HARD",
    question: "Two dice are thrown together. What is the probability of getting a sum of 8?",
    options: ["5/36", "6/36", "4/36", "7/36"], correct: 0,
    explanation: "Sum 8 pairs: (2,6)(3,5)(4,4)(5,3)(6,2) = 5 outcomes out of 36." },

  { category: "Logical Reasoning", topic: "Number Series", difficulty: "EASY",
    question: "Find the next number: 2, 6, 12, 20, 30, ?",
    options: ["36", "40", "42", "44"], correct: 2,
    explanation: "Differences are 4,6,8,10,12 → 30+12 = 42." },
  { category: "Logical Reasoning", topic: "Number Series", difficulty: "MEDIUM",
    question: "Find the next number: 3, 7, 15, 31, 63, ?",
    options: ["95", "111", "127", "135"], correct: 2,
    explanation: "Each term = previous×2 + 1. 63×2+1 = 127." },
  { category: "Logical Reasoning", topic: "Blood Relations", difficulty: "MEDIUM",
    question: "Pointing to a photo, Ravi said, \"She is the daughter of my grandfather's only son.\" How is the girl related to Ravi?",
    options: ["Sister", "Cousin", "Aunt", "Niece"], correct: 0,
    explanation: "Grandfather's only son is Ravi's father, so his daughter is Ravi's sister." },
  { category: "Logical Reasoning", topic: "Coding-Decoding", difficulty: "EASY",
    question: "In a code, CAT is written as DBU. How is DOG written in that code?",
    options: ["EPH", "EPI", "FPI", "EOI"], correct: 0,
    explanation: "Each letter shifts forward by 1: D→E, O→P, G→H → EPH." },
  { category: "Logical Reasoning", topic: "Syllogisms", difficulty: "HARD",
    question: "Statements: All pens are books. Some books are pencils. Conclusion I: Some pencils are pens. Conclusion II: Some books are pens.",
    options: ["Only I follows", "Only II follows", "Both follow", "Neither follows"], correct: 1,
    explanation: "\"All pens are books\" directly gives \"Some books are pens\" (conversion). The pencils link is not guaranteed, so only II follows." },
  { category: "Logical Reasoning", topic: "Direction Sense", difficulty: "EASY",
    question: "Rohit walks 5 km north, then 3 km east, then 5 km south. How far is he from the start?",
    options: ["3 km", "5 km", "8 km", "13 km"], correct: 0,
    explanation: "The north and south legs cancel out, leaving only the 3 km eastward displacement." },
  { category: "Logical Reasoning", topic: "Calendars", difficulty: "MEDIUM",
    question: "If 1st January 2024 was a Monday, what day was 1st January 2025? (2024 is a leap year)",
    options: ["Tuesday", "Wednesday", "Thursday", "Friday"], correct: 1,
    explanation: "A leap year has 366 days = 52 weeks + 2 days, so the day advances by 2: Monday → Wednesday." },

  { category: "Verbal Ability", topic: "Synonyms", difficulty: "EASY",
    question: "Choose the word closest in meaning to \"CANDID\":",
    options: ["Frank", "Timid", "Elegant", "Cautious"], correct: 0,
    explanation: "\"Candid\" means honest and straightforward, which matches \"Frank\"." },
  { category: "Verbal Ability", topic: "Antonyms", difficulty: "EASY",
    question: "Choose the word most opposite in meaning to \"ABUNDANT\":",
    options: ["Plentiful", "Scarce", "Massive", "Generous"], correct: 1,
    explanation: "\"Abundant\" means plentiful; its opposite is \"scarce\"." },
  { category: "Verbal Ability", topic: "Sentence Correction", difficulty: "MEDIUM",
    question: "Identify the correct sentence:",
    options: [
      "Neither of the boys have finished their homework.",
      "Neither of the boys has finished his homework.",
      "Neither of the boys has finished their homework.",
      "Neither of the boys finish his homework.",
    ], correct: 1,
    explanation: "\"Neither\" is singular, so it takes \"has\" and the singular pronoun \"his\"." },
  { category: "Verbal Ability", topic: "Error Detection", difficulty: "MEDIUM",
    question: "Spot the error: \"Each of the students / have submitted / their assignment on time.\"",
    options: ["Each of the students", "have submitted", "their assignment on time", "No error"], correct: 1,
    explanation: "\"Each\" is singular, so the verb should be \"has submitted\", not \"have submitted\"." },
  { category: "Verbal Ability", topic: "Idioms", difficulty: "EASY",
    question: "\"To burn the midnight oil\" means:",
    options: ["To waste resources", "To work late into the night", "To start a fire", "To relax completely"], correct: 1,
    explanation: "The idiom means to study or work late into the night." },
];

async function main() {
  console.log("Seeding categories and topics…");
  const categoryIds: Record<string, string> = {};
  const topicIds: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), order: cat.order },
    });
    categoryIds[cat.name] = created.id;

    const topics = TOPICS[cat.name] ?? [];
    for (let i = 0; i < topics.length; i++) {
      const topicName = topics[i];
      const t = await prisma.topic.upsert({
        where: { categoryId_slug: { categoryId: created.id, slug: slugify(topicName) } },
        update: {},
        create: { name: topicName, slug: slugify(topicName), order: i, categoryId: created.id },
      });
      topicIds[`${cat.name}::${topicName}`] = t.id;
    }
  }

  console.log("Seeding achievements…");
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { key: a.key }, update: {}, create: a });
  }

  console.log(`Seeding ${QUESTIONS.length} questions…`);
  for (const q of QUESTIONS) {
    const hash = contentHash(q.question);
    await prisma.question.upsert({
      where: { contentHash: hash },
      update: {},
      create: {
        question: q.question,
        options: q.options,
        correctAnswer: q.correct,
        explanation: q.explanation,
        difficulty: q.difficulty,
        categoryId: categoryIds[q.category],
        topicId: topicIds[`${q.category}::${q.topic}`],
        sourceType: "SEED",
        contentHash: hash,
        reviewStatus: "APPROVED",
      },
    });
  }

  console.log("Seeding a demo admin account (admin@aptiquest.dev / admin1234)…");
  const bcrypt = await import("bcryptjs");
  await prisma.user.upsert({
    where: { email: "admin@aptiquest.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@aptiquest.dev",
      passwordHash: await bcrypt.hash("admin1234", 10),
      role: "ADMIN",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
