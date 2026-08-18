import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar, BottomNav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: (sessionUser as { id: string }).id } });
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 px-5 md:px-8 py-7 max-w-5xl w-full mx-auto">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
