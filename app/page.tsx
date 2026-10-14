import { Suspense } from "react";
import { OmniStatus } from "@/app/components/omni-status";
import { requirePage } from "@/lib/auth";
import { listRoutes } from "@/lib/api-routes";
import { listConversations } from "@/lib/interactions";
import { omniConfigured } from "@/lib/omni";
import { formatReais } from "@/lib/rates";
import { listSpend } from "@/lib/spend";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando painel…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const user = await requirePage("painel");
  const configured = await omniConfigured();
  const [conversations, spend, routes] = await Promise.all([
    listConversations(),
    listSpend(),
    listRoutes(),
  ]);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Olá, {user.name}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {user.email} · {user.accessName}
      </p>
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="text-sm text-zinc-500">Conversas</p>
          <p className="mt-1 text-2xl font-semibold">{conversations.length}</p>
        </article>
        <article className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="text-sm text-zinc-500">Gasto dos envios</p>
          <p className="mt-1 text-2xl font-semibold">{formatReais(spend.totalCents)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="text-sm text-zinc-500">Rotas</p>
          <p className="mt-1 text-2xl font-semibold">{routes.length}</p>
        </article>
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-medium">Omni Z-API</h2>
        <OmniStatus configured={configured} />
      </section>
    </>
  );
}
