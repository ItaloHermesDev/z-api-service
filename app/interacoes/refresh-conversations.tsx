"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshConversations() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        router.refresh();
        setPending(false);
      }}
      className="h-11 rounded-lg border border-black/10 px-4 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
    >
      {pending ? "Atualizando…" : "Atualizar conversas"}
    </button>
  );
}
