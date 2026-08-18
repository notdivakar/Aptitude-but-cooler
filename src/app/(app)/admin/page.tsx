import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

export default async function AdminPage() {
  const sessionUser = await getCurrentUser();
  const user = await prisma.user.findUnique({ where: { id: (sessionUser as { id: string }).id } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const [questionCount, userCount, pendingReview] = await Promise.all([
    prisma.question.count(),
    prisma.user.count(),
    prisma.question.count({ where: { reviewStatus: "PENDING" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-ink">Admin</h1>
        <p className="text-mute text-sm mt-1.5">Live counts below are real. The management screens are TODO.</p>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <Card className="p-4">
          <div className="font-mono font-bold text-xl text-ink">{questionCount}</div>
          <div className="text-mute text-[11px] mt-0.5">Questions in bank</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono font-bold text-xl text-ink">{userCount}</div>
          <div className="text-mute text-[11px] mt-0.5">Registered users</div>
        </Card>
        <Card className="p-4">
          <div className="font-mono font-bold text-xl text-ink">{pendingReview}</div>
          <div className="text-mute text-[11px] mt-0.5">Pending review</div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-ink font-display font-bold text-sm mb-2">TODO — not built yet</p>
        <ul className="text-mute text-sm list-disc list-inside space-y-1">
          <li>Question CRUD (add / edit / delete) — spec §39</li>
          <li>Content → Import crawler UI with pause/resume/cancel — spec §11-14</li>
          <li>Review queue for imported/flagged questions — spec §13</li>
          <li>Category/topic/achievement/daily-challenge management</li>
          <li>Per-question analytics (attempts, accuracy, most-missed option) — spec §39</li>
          <li>Import history table — spec §40</li>
        </ul>
      </Card>
    </div>
  );
}
