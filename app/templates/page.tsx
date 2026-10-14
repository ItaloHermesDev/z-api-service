import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { OmniStatus } from "@/app/components/omni-status";
import { SyncButton } from "@/app/templates/sync-button";
import { TemplateForm } from "@/app/templates/template-form";
import { requirePage } from "@/lib/auth";
import {
  OmniError,
  listBusinesses,
  listTemplates,
  omniConfigured,
  type MessageTemplate,
  type WhatsAppBusiness,
} from "@/lib/omni";
import { categoryLabel, languageLabel, statusLabel } from "@/lib/templates";

export default function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ waba?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando templates…</p>}>
      <TemplatesScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function TemplatesScreen({
  searchParams,
}: {
  searchParams: Promise<{ waba?: string }>;
}) {
  await requirePage("templates");
  const configured = await omniConfigured();
  const { waba } = await searchParams;

  let loadError = "";
  let businesses: WhatsAppBusiness[] = [];
  if (configured) {
    try {
      businesses = await listBusinesses();
    } catch (error) {
      unstable_rethrow(error);
      loadError = error instanceof OmniError ? error.message : "Não foi possível listar as contas.";
    }
  }

  const selected =
    businesses.find((business) => business.businessId === waba) ?? businesses[0];

  let templates: MessageTemplate[] = [];
  if (configured && selected && !loadError) {
    try {
      templates = await listTemplates(selected.businessId);
    } catch (error) {
      unstable_rethrow(error);
      loadError = error instanceof OmniError ? error.message : "Não foi possível listar os templates.";
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Cria um template da API oficial do WhatsApp e mostra se a Meta aprovou,
            recusou ou ainda está analisando.
          </p>
        </div>
        <TemplateForm configured={configured && !loadError} wabaId={selected?.businessId ?? ""} />
      </div>
      <OmniStatus configured={configured} />
      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      {configured && !loadError && businesses.length === 0 ? (
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Nenhuma conta de WhatsApp oficial apareceu para esta chave. Conecte um
          canal Meta WhatsApp antes de criar templates.
        </p>
      ) : null}
      {businesses.length > 1 ? (
        <form method="get" className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
            Conta WhatsApp
            <select
              name="waba"
              defaultValue={selected?.businessId}
              className="h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15"
            >
              {businesses.map((business) => (
                <option key={business.businessId} value={business.businessId}>
                  {business.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-11 rounded-lg border border-black/10 px-4 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
          >
            Ver esta conta
          </button>
        </form>
      ) : selected ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Conta: {selected.name}
        </p>
      ) : null}
      {selected ? (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-lg font-medium">Aprovação</h2>
            <SyncButton wabaId={selected.businessId} />
          </div>
          {templates.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Nenhum template nesta conta.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Nome</th>
                    <th className="py-2 pr-4 font-medium">Idioma</th>
                    <th className="py-2 pr-4 font-medium">Categoria</th>
                    <th className="py-2 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr
                      key={`${template.id}-${template.name}-${template.language}`}
                      className="border-t border-black/10 dark:border-white/10"
                    >
                      <td className="py-3 pr-4 font-mono text-xs">{template.name}</td>
                      <td className="py-3 pr-4">{languageLabel(template.language)}</td>
                      <td className="py-3 pr-4">{categoryLabel(template.category)}</td>
                      <td className="py-3">
                        <StatusBadge status={template.status} />
                        {template.rejectedReason ? (
                          <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                            {template.rejectedReason}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-12">
          <h2 className="text-lg font-medium">Aprovação</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Quando a conta oficial estiver ligada, os templates aparecem aqui como
            em análise, aprovado ou recusado. O botão de atualizar consulta a Meta
            de novo.
          </p>
        </section>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
      : status === "REJECTED"
        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
        : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}
