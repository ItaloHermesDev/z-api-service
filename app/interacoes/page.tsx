import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { OmniStatus } from "@/app/components/omni-status";
import { DispatchForm } from "@/app/interacoes/dispatch-form";
import { RefreshConversations } from "@/app/interacoes/refresh-conversations";
import { requirePage } from "@/lib/auth";
import { listChannels } from "@/lib/channels";
import { listConversations } from "@/lib/interactions";
import {
  OmniError,
  listBusinesses,
  listTemplates,
  omniConfigured,
  type MessageTemplate,
} from "@/lib/omni";

const when = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default function InteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ waba?: string; conversa?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando conversas…</p>}>
      <InteractionsScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function InteractionsScreen({
  searchParams,
}: {
  searchParams: Promise<{ waba?: string; conversa?: string }>;
}) {
  await requirePage("interacoes");
  const configured = await omniConfigured();
  const { waba, conversa } = await searchParams;
  const address = await webhookAddress();

  let loadError = "";
  let templates: MessageTemplate[] = [];
  if (configured) {
    try {
      const businesses = await listBusinesses();
      const selected = businesses.find((business) => business.businessId === waba) ?? businesses[0];
      if (selected) {
        const listed = await listTemplates(selected.businessId);
        templates = listed.filter((item) => item.status === "APPROVED");
      }
    } catch (error) {
      unstable_rethrow(error);
      loadError = error instanceof OmniError ? error.message : "Não foi possível listar os templates.";
    }
  }

  const [conversations, channels] = await Promise.all([listConversations(), listChannels()]);
  const selected =
    conversations.find((item) => item.id === conversa) ?? conversations[0];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Conversas</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Cada conversa mostra o template que a abriu e as mensagens que
            chegaram depois.
          </p>
        </div>
        <DispatchForm
          configured={configured && !loadError}
          templates={templates.map((item) => ({
            name: item.name,
            language: item.language,
            body: item.body,
            category: item.category,
          }))}
          channels={channels.map((channel) => ({ id: channel.id, name: channel.name }))}
        />
      </div>
      <OmniStatus configured={configured} />
      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">Conversas</h2>
        <RefreshConversations />
      </div>
      {conversations.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Nenhuma conversa ainda. O disparo de um template abre a conversa e
          registra qual template a iniciou.
        </p>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[18rem_1fr]">
          <ul className="flex flex-col gap-2">
            {conversations.map((item) => {
              const active = item.id === selected?.id;
              const params = new URLSearchParams();
              if (waba) {
                params.set("waba", waba);
              }
              params.set("conversa", item.id);
              return (
                <li key={item.id}>
                  <Link
                    href={`/interacoes?${params}`}
                    className={
                      active
                        ? "block rounded-xl border border-teal-800 bg-teal-50 px-3 py-3 dark:border-teal-300 dark:bg-teal-950/40"
                        : "block rounded-xl border border-black/10 px-3 py-3 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    }
                  >
                    <p className="font-medium">{item.phone}</p>
                    <p className="mt-1 text-xs font-medium text-teal-800 dark:text-teal-300">
                      Iniciada por {item.templateName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.preview}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
          {selected ? (
            <section className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
              <p className="text-xs font-medium tracking-wide text-teal-800 uppercase dark:text-teal-300">
                Template que iniciou
              </p>
              <h2 className="mt-1 font-mono text-lg">{selected.templateName}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {selected.phone} · {selected.language} · {when.format(selected.startedAt)}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {selected.messages.map((message) => (
                  <li
                    key={message.id}
                    className={
                      message.direction === "recebida"
                        ? "ml-6 rounded-xl bg-zinc-100 px-3 py-2 text-sm dark:bg-white/5"
                        : message.direction === "template"
                          ? "rounded-xl border border-dashed border-teal-800/40 px-3 py-2 text-sm"
                          : "mr-6 rounded-xl bg-teal-50 px-3 py-2 text-sm dark:bg-teal-950/40"
                    }
                  >
                    <p className="text-xs text-zinc-500">
                      {message.direction === "recebida"
                        ? "Contato"
                        : message.direction === "template"
                          ? "Template"
                          : "Enviada"}{" "}
                      · {when.format(message.createdAt)}
                    </p>
                    <p className="mt-1 leading-6">{message.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
      <section className="mt-8 rounded-2xl border border-dashed border-teal-800/30 px-4 py-4 dark:border-teal-300/30">
        <h2 className="text-sm font-medium">Receber as conversas</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Cadastre este endereço como webhook do canal na Omni. Ele precisa ser
          público: o endereço local não recebe os eventos.
        </p>
        <p className="mt-3 break-all font-mono text-xs leading-5">{address}</p>
        {process.env.OMNI_WEBHOOK_TOKEN?.trim() ? null : (
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Defina OMNI_WEBHOOK_TOKEN no servidor para a Omni precisar desse
            segredo ao chamar o endereço.
          </p>
        )}
      </section>
    </>
  );
}

async function webhookAddress() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const token = process.env.OMNI_WEBHOOK_TOKEN?.trim();
  const path = token ? `/webhooks/omni?token=${encodeURIComponent(token)}` : "/webhooks/omni";
  return host ? `${proto}://${host}${path}` : path;
}
