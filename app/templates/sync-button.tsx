"use client";

import { useActionState } from "react";
import { syncTemplatesAction } from "@/app/actions/templates";

export function SyncButton({ wabaId }: { wabaId: string }) {
  const [state, action, pending] = useActionState(syncTemplatesAction, undefined);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="wabaId" value={wabaId} />
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg border border-black/10 px-4 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
      >
        {pending ? "Consultando…" : "Atualizar aprovação"}
      </button>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.notice ? (
        <p className="text-sm text-teal-800 dark:text-teal-300">{state.notice}</p>
      ) : null}
    </form>
  );
}
