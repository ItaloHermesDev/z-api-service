import { Suspense } from "react";
import { RateForm } from "@/app/gastos/rate-form";
import { requirePage } from "@/lib/auth";
import { formatReais, rateLabel } from "@/lib/rates";
import { listSpend } from "@/lib/spend";

export default function SpendPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando gastos…</p>}>
      <SpendScreen />
    </Suspense>
  );
}

async function SpendScreen() {
  await requirePage("gastos");
  const spend = await listSpend();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gastos</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Cada linha é um template. O valor é a quantidade de disparos feitos
            neste painel vezes o preço da categoria.
          </p>
        </div>
        <RateForm rates={spend.rates} />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="text-sm text-zinc-500">Envios</p>
          <p className="mt-1 text-2xl font-semibold">{spend.sends}</p>
        </section>
        <section className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="text-sm text-zinc-500">Gasto</p>
          <p className="mt-1 text-2xl font-semibold">{formatReais(spend.totalCents)}</p>
        </section>
      </div>
      {spend.items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
          Nenhum template disparado ainda.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Template</th>
                <th className="py-2 pr-4 font-medium">Categoria</th>
                <th className="py-2 pr-4 font-medium">Envios</th>
                <th className="py-2 pr-4 font-medium">Preço por envio</th>
                <th className="py-2 font-medium">Gasto</th>
              </tr>
            </thead>
            <tbody>
              {spend.items.map((item) => (
                <tr
                  key={`${item.templateName}-${item.language}`}
                  className="border-t border-black/10 dark:border-white/10"
                >
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs">{item.templateName}</span>
                    <span className="mt-1 block text-xs text-zinc-500">{item.language}</span>
                  </td>
                  <td className="py-3 pr-4">{rateLabel(item.category)}</td>
                  <td className="py-3 pr-4">{item.sends}</td>
                  <td className="py-3 pr-4">{formatReais(item.priceCents)}</td>
                  <td className="py-3 font-medium">{formatReais(item.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
