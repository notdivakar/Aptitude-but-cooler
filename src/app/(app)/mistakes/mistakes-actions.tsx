"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MistakesActions({ count }: { count: number }) {
  return (
    <Link
      href="/practice?mistakes=1"
      className="inline-flex items-center gap-2 bg-gradient-to-br from-violet to-violet-dim text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
    >
      Practice my mistakes <ArrowRight size={15} />
    </Link>
  );
}
