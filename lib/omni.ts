import "server-only";
import { io } from "next/cache";
import { isChannelType, type ChannelType } from "@/lib/channel-types";
import { buildTemplatePayload } from "@/lib/templates";

const API_URL = "https://api.omni.z-api.io";

export class OmniError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OmniError";
  }
}

export async function omniConfigured() {
  await io();
  return Boolean(process.env.OMNI_SECRET_KEY?.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorDetail(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  const buckets = [payload.error, payload.value, payload];
  for (const bucket of buckets) {
    if (!isRecord(bucket) || !Array.isArray(bucket.errors)) {
      continue;
    }
    for (const item of bucket.errors) {
      if (isRecord(item) && typeof item.message === "string" && item.message.trim()) {
        return item.message;
      }
      if (isRecord(item) && typeof item.description === "string" && item.description.trim()) {
        return item.description;
      }
    }
  }

  return "";
}

async function omniRequest(path: string, init?: { method?: "GET" | "POST"; body?: unknown }) {
  await io();
  const secret = process.env.OMNI_SECRET_KEY?.trim();
  if (!secret) {
    throw new OmniError(
      "A Secret Key ainda não está no servidor. Coloque OMNI_SECRET_KEY no .env.local e reinicie o painel.",
    );
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${secret}` };
  const method = init?.method ?? "POST";
  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new OmniError("Não foi possível falar com a Omni agora.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      throw new OmniError("A Secret Key foi recusada.");
    }
    throw new OmniError(explainOmniFailure(errorDetail(payload)));
  }

  return payload;
}

function explainOmniFailure(detail: string) {
  const text = detail.toLowerCase();
  if (text.includes("enterprise") && text.includes("channel creation")) {
    return "Esta conta não cria canal pela API. A Omni exige o papel ENTERPRISE para isso. Crie o canal no painel da Omni e registre o identificador aqui.";
  }
  if (text.includes("enterprise")) {
    return "A Omni recusou porque esta conta não tem o papel ENTERPRISE.";
  }
  return detail || "A Omni recusou este pedido.";
}

function readList(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

export async function createChannel(input: { name: string; type: ChannelType }) {
  if (!input.name.trim()) {
    throw new OmniError("Informe o nome do canal.");
  }
  if (!isChannelType(input.type)) {
    throw new OmniError("Escolha um tipo de canal.");
  }

  const payload = (await omniRequest("/v1/channels", {
    body: { name: input.name.trim(), type: input.type },
  })) as { id?: string } | null;
  if (!payload?.id) {
    throw new OmniError("A Omni não devolveu o identificador do canal.");
  }
  return payload.id;
}

export type WhatsAppBusiness = {
  businessId: string;
  name: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  body: string;
  rejectedReason?: string;
};

function assertWabaId(wabaId: string) {
  if (!/^\d{6,32}$/.test(wabaId)) {
    throw new OmniError("Escolha a conta de WhatsApp oficial.");
  }
}

export async function listBusinesses() {
  const payload = await omniRequest("/whatsapp/businesses", { method: "GET" });
  return readList(payload).flatMap((item): WhatsAppBusiness[] => {
    if (!isRecord(item) || typeof item.businessId !== "string") {
      return [];
    }
    return [
      {
        businessId: item.businessId,
        name: typeof item.name === "string" && item.name.trim() ? item.name : item.businessId,
      },
    ];
  });
}

function bodyText(item: Record<string, unknown>) {
  if (!Array.isArray(item.components)) {
    return "";
  }
  for (const component of item.components) {
    if (
      isRecord(component) &&
      component.type === "BODY" &&
      typeof component.text === "string"
    ) {
      return component.text;
    }
  }
  return "";
}

function readTemplates(payload: unknown): MessageTemplate[] {
  return readList(payload).flatMap((item): MessageTemplate[] => {
    if (!isRecord(item) || typeof item.name !== "string") {
      return [];
    }
    const reason =
      typeof item.rejected_reason === "string"
        ? item.rejected_reason
        : typeof item.rejectedReason === "string"
          ? item.rejectedReason
          : undefined;
    return [
      {
        id: typeof item.id === "string" ? item.id : "",
        name: item.name,
        status: typeof item.status === "string" ? item.status : "PENDING",
        category: typeof item.category === "string" ? item.category : "",
        language: typeof item.language === "string" ? item.language : "",
        body: bodyText(item),
        rejectedReason: reason?.trim() || undefined,
      },
    ];
  });
}

export async function listTemplates(wabaId: string) {
  assertWabaId(wabaId);
  const items: MessageTemplate[] = [];
  let after = "";

  for (let page = 0; page < 5; page += 1) {
    const params = new URLSearchParams({ limit: "100" });
    if (after) {
      params.set("after", after);
    }
    const payload = await omniRequest(
      `/whatsapp/businesses/${wabaId}/templates?${params}`,
      { method: "GET" },
    );
    const batch = readTemplates(payload);
    items.push(...batch);
    const next =
      isRecord(payload) &&
      isRecord(payload.paging) &&
      isRecord(payload.paging.cursors) &&
      typeof payload.paging.cursors.after === "string"
        ? payload.paging.cursors.after
        : "";
    if (!next || next === after || batch.length === 0) {
      break;
    }
    after = next;
  }

  return items;
}

export async function syncTemplates(wabaId: string) {
  assertWabaId(wabaId);
  await omniRequest(`/whatsapp/businesses/${wabaId}/templates/sync`, { method: "POST" });
}

export async function createMessageTemplate(input: {
  wabaId: string;
  name: string;
  category: string;
  language: string;
  body: string;
  footer: string;
  examples: Record<string, string>;
}) {
  assertWabaId(input.wabaId);
  const built = buildTemplatePayload(input);
  if ("error" in built && built.error) {
    throw new OmniError(built.error);
  }
  if (!("payload" in built)) {
    throw new OmniError("Não foi possível montar o template.");
  }

  const payload = (await omniRequest(`/whatsapp/businesses/${input.wabaId}/templates`, {
    body: built.payload,
  })) as { id?: string; status?: string; category?: string } | null;

  if (!payload?.id) {
    throw new OmniError("A Omni não devolveu o identificador do template.");
  }

  return {
    id: payload.id,
    status: payload.status ?? "PENDING",
    category: payload.category ?? input.category,
  };
}

export async function sendTemplateMessage(input: {
  channelId: string;
  phone: string;
  name: string;
  language: string;
  parameters: { name: string; text: string }[];
  named: boolean;
}) {
  const channelId = input.channelId.trim();
  const phone = input.phone.replace(/\D/g, "");
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(channelId)) {
    throw new OmniError("Informe o identificador do canal.");
  }
  if (phone.length < 12) {
    throw new OmniError("Informe o telefone com DDI e DDD, só números.");
  }
  if (!/^[a-z0-9_]+$/.test(input.name)) {
    throw new OmniError("Escolha um template aprovado.");
  }

  const parameters = input.parameters.map((parameter) =>
    input.named
      ? { type: "text", parameter_name: parameter.name, text: parameter.text }
      : { type: "text", text: parameter.text },
  );

  const payload = (await omniRequest(`/v1/channels/${encodeURIComponent(channelId)}/messages`, {
    body: {
      recipient: { identifier: phone },
      content: {
        type: "TEMPLATE",
        attachments: [
          {
            template: {
              name: input.name,
              language: { policy: "deterministic", code: input.language },
              components: [{ type: "body", parameters }],
            },
          },
        ],
      },
    },
  })) as { messageId?: string } | null;

  if (!payload?.messageId) {
    throw new OmniError("A Omni não devolveu o identificador da mensagem.");
  }

  return { messageId: payload.messageId, channelId, phone };
}

export async function registerMessageWebhook(input: {
  channelId: string;
  url: string;
  token: string;
}) {
  const channelId = input.channelId.trim();
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(channelId)) {
    throw new OmniError("Informe o identificador do canal.");
  }
  await omniRequest(`/v1/channels/${encodeURIComponent(channelId)}/webhooks`, {
    body: {
      url: input.url,
      description: "Recebe mensagens no Omini Z Service",
      events: ["MESSAGE_RECEIVED", "MESSAGE_STATUS"],
      payloadFormat: "DEFAULT",
      auth: { type: "BEARER", token: input.token },
    },
  });
}
