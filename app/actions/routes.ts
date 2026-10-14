"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { createRoute, deleteRoute } from "@/lib/api-routes";
import { OmniError, omniConfigured, registerMessageWebhook } from "@/lib/omni";
import { rateCategory } from "@/lib/rates";

export type RouteFormState = {
  error?: string;
  notice?: string;
  saved?: boolean;
};

async function publicOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

export async function createRouteAction(
  _state: RouteFormState | undefined,
  formData: FormData,
): Promise<RouteFormState> {
  await requirePage("rotas");

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const channelId = String(formData.get("channelId") ?? "").trim();
  if (name.length < 2 || name.length > 80) {
    return { error: "Dê um nome de 2 a 80 caracteres." };
  }
  if (kind !== "receber" && kind !== "disparar") {
    return { error: "Escolha o tipo da rota." };
  }

  let templateName = "";
  let language = "";
  let category = "OUTROS";
  let body = "";
  if (kind === "disparar") {
    const template = String(formData.get("template") ?? "");
    const splitAt = template.lastIndexOf("|");
    templateName = splitAt > 0 ? template.slice(0, splitAt) : String(formData.get("templateName") ?? "").trim();
    language = splitAt > 0 ? template.slice(splitAt + 1) : String(formData.get("language") ?? "").trim();
    category = rateCategory(String(formData.get("category") ?? ""));
    body = String(formData.get("body") ?? "");
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(channelId)) {
      return { error: "Informe o identificador do canal." };
    }
    if (!/^[a-z0-9_]+$/.test(templateName)) {
      return { error: "Informe o nome do template em letras minúsculas." };
    }
    if (!/^[a-z]{2}(_[A-Z]{2})?$/.test(language)) {
      return { error: "Informe o idioma, como pt_BR." };
    }
  }

  try {
    const created = await createRoute({
      name,
      kind,
      channelId,
      templateName,
      language,
      category,
      body,
    });
    let notice = "Rota criada.";
    if (kind === "receber" && channelId) {
      const origin = await publicOrigin();
      const local = !origin || origin.includes("localhost") || origin.includes("127.0.0.1");
      if (local) {
        notice = "Rota criada. O endereço local não recebe eventos da Omni até estar público.";
      } else if (await omniConfigured()) {
        try {
          await registerMessageWebhook({
            channelId,
            url: `${origin}/api/rotas/${created.id}`,
            token: created.token,
          });
          notice = "Rota criada e registrada no canal para receber mensagens.";
        } catch (error) {
          unstable_rethrow(error);
          const detail = error instanceof OmniError ? error.message : "A Omni não registrou o webhook.";
          notice = `Rota criada. ${detail}`;
        }
      }
    }
    revalidatePath("/rotas");
    return { saved: true, notice };
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Não foi possível criar a rota agora." };
  }
}

export async function deleteRouteAction(id: string) {
  await requirePage("rotas");
  await deleteRoute(id);
  revalidatePath("/rotas");
}
