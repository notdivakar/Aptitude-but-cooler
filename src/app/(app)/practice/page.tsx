import { prisma } from "@/lib/prisma";
import { PracticeClient } from "./practice-client";

export default async function PracticePage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { topics: { orderBy: { order: "asc" } } },
  });

  return <PracticeClient categories={categories} />;
}
