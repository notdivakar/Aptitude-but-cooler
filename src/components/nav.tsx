"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Dumbbell, ListChecks, Trophy, User, Sword, LogOut, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Dumbbell },
  { href: "/mistakes", label: "Mistakes", icon: ListChecks },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }] : NAV_ITEMS;

  return (
    <div className="hidden md:flex w-60 shrink-0 border-r border-border bg-bgsoft px-4 py-7 flex-col gap-1">
      <div className="flex items-center gap-2.5 px-2.5 pb-7">
        <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-violet to-gold flex items-center justify-center w-9 h-9">
          <Sword size={17} className="text-bg" strokeWidth={2.5} />
        </div>
        <span className="font-display font-extrabold text-lg text-ink">AptiQuest</span>
      </div>

      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              active ? "bg-violet/10 text-violet" : "text-mute hover:text-ink"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        );
      })}

      <div className="flex-1" />

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-faint hover:text-bad transition-colors"
      >
        <LogOut size={17} /> Sign out
      </button>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="flex md:hidden sticky bottom-0 justify-around bg-bgsoft/95 backdrop-blur border-t border-border px-1 py-2.5">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 ${active ? "text-violet" : "text-faint"}`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
