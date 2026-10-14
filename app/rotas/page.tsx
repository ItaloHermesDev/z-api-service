import { Suspense } from "react";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { deleteRouteAction } from "@/app/actions/routes";
import { ConfirmSubmit } from "@/app/components/confirm-submit";
import { OmniStatus } from "@/app/components/omni-status";
import { RouteForm } from "@/app/rotas/route-form";
import { requirePage } from "@/lib/auth";
import { listRoutes } from "@/lib/api-routes";
import { listChannels } from "@/lib/channels";
import { OmniError, listBusinesses, listTemplates, omniConfigured } from "@/lib/omni";
import { placeholders } from "@/lib/templates";

export default function RoutesPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando rotas…</p>}>
      <RoutesScreen />
    </Suspense>
  );
}

async function RoutesScreen() {
  await requirePage("rotas");
  const configured = await omniConfigured();
  const origin = await publicOrigin();

  let loadError = "";
  let templates: { name: string; language: string; body: string; category: string }[] = [];
  if (configured) {
    try {
      const businesses = await listBusinesses();
      const selected = businesses[0];
      if (selected) {
        const listed = await listTemplates(selected.businessId);
        templates = listed
          .filter((item) => item.status === "APPROVED")
          .map((item) => ({
            name: item.name,
            language: item.language,
            body: item.body,
            category: item.category,
          }));
      }
    } catch (error) {
      unstable_rethrow(error);
      loadError = error instanceof OmniError ? error.message : "Não foi possível listar os templates.";
    }
  }

  const [routes, channels] = await Promise.all([listRoutes(), listChannels()]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rotas</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Cria um endereço para receber mensagens e outro para disparar um
            template. Quem chama a rota envia o token no cabeçalho Authorization.
          </p>
        </div>
        <RouteForm
          templates={templates}
          channels={channels.map((channel) => ({ id: channel.id, name: channel.name }))}
        />
      </div>
      <OmniStatus configured={configured} />
      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      {routes.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">Nenhuma rota criada.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {routes.map((route) => {
            const url = `${origin}/api/rotas/${route.id}`;
            const names = placeholders(route.body);
            return (
              <article
                key={route.id}
                className="rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium">{route.name}</h2>
                    <p className="mt-1 text-sm text-teal-800 dark:text-teal-300">
                      {route.kind === "receber" ? "Recebe mensagens" : `Dispara ${route.templateName}`}
                    </p>
                  </div>
                  <ConfirmSubmit
                    action={deleteRouteAction.bind(null, route.id)}
                    label="Excluir"
                    confirm={`Excluir a rota ${route.name}?`}
                  />
                </div>
                <p className="mt-3 break-all font-mono text-xs leading-5">{url}</p>
                <p className="mt-2 break-all font-mono text-xs leading-5 text-zinc-500">
                  Authorization: Bearer {route.token}
                </p>
                {route.kind === "disparar" ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Envie POST com o telefone
                    {names.length > 0
                      ? ` e as variáveis ${names.map((name) => `{{${name}}}`).join(", ")}`
                      : ""}
                    . Exemplo: {`{"phone":"5511999999999","variables":{${names.map((name) => `"${name}":""`).join(",")}}}`}
                  </p>
                ) : route.messages.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Nenhuma mensagem recebida nesta rota.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {route.messages.map((message) => (
                      <li key={message.id} className="text-sm leading-6">
                        <span className="text-zinc-500">
                          {message.phone || "sem telefone"} · {message.direction}
                        </span>
                        <span className="mt-0.5 block">{message.summary}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

async function publicOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}
