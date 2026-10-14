import { io, revalidatePath } from "next/cache";
import { findRoute, rememberRouteMessage, routeTokenMatches } from "@/lib/api-routes";
import { recordDispatch, recordIncoming } from "@/lib/interactions";
import { OmniError, sendTemplateMessage } from "@/lib/omni";
import { placeholders } from "@/lib/templates";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  return new URL(request.url).searchParams.get("token")?.trim() ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function textOf(value: unknown) {
  if (!isRecord(value)) {
    return "";
  }
  if (typeof value.message === "string" && value.message.trim()) {
    return value.message.trim();
  }
  if (typeof value.title === "string" && value.title.trim()) {
    return value.title.trim();
  }
  if (typeof value.caption === "string" && value.caption.trim()) {
    return value.caption.trim();
  }
  return typeof value.type === "string" ? value.type : "";
}

function describe(payload: unknown) {
  const message = isRecord(payload) && isRecord(payload.message) ? payload.message : payload;
  if (!isRecord(message)) {
    return { externalId: "", phone: "", direction: "recebida", summary: "Mensagem recebida" };
  }
  const metadata = isRecord(message.metadata) ? message.metadata : {};
  const fromMe = metadata.from_me === true;
  const sender = isRecord(message.sender) ? message.sender : {};
  const recipient = isRecord(message.recipient) ? message.recipient : {};
  const phone = String(fromMe ? recipient.identifier : sender.identifier ?? "").replace(/\D/g, "");
  const contents = Array.isArray(message.contents) ? message.contents : [];
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const summary = textOf(contents[0]) || textOf(attachments[0]) || "Mensagem recebida";
  const externalId = typeof message._id === "string" && message._id.trim() ? message._id.trim() : "";
  return {
    externalId,
    phone,
    direction: fromMe ? "enviada" : "recebida",
    summary,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await io();
  const { id } = await context.params;
  const route = await findRoute(id);
  if (!route) {
    return Response.json({ error: "Rota não encontrada." }, { status: 404 });
  }
  if (!routeTokenMatches(bearerToken(request), route.token)) {
    return Response.json({ error: "Token recusado." }, { status: 401 });
  }

  const payload: unknown = await request.json().catch(() => null);

  if (route.kind === "receber") {
    const message = describe(payload);
    try {
      await recordIncoming(payload);
      await rememberRouteMessage({
        routeId: route.id,
        externalId: message.externalId || crypto.randomUUID(),
        phone: message.phone,
        direction: message.direction,
        summary: message.summary,
      });
      revalidatePath("/rotas");
      revalidatePath("/interacoes");
    } catch (error) {
      console.error(error instanceof Error ? error.message : "rota");
      return Response.json({ error: "Não foi possível guardar a mensagem." }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  if (!isRecord(payload)) {
    return Response.json({ error: "Envie o telefone e as variáveis em JSON." }, { status: 400 });
  }
  const names = placeholders(route.body);
  const numeric = names.every((item) => /^\d+$/.test(item));
  const ordered = numeric ? [...names].sort((left, right) => Number(left) - Number(right)) : names;
  const variables = isRecord(payload.variables) ? payload.variables : {};
  const parameters = ordered.map((name) => ({
    name,
    text: String(variables[name] ?? "").trim(),
  }));
  const missing = parameters.find((item) => !item.text);
  if (missing) {
    return Response.json({ error: `Informe a variável ${missing.name}.` }, { status: 400 });
  }

  try {
    const sent = await sendTemplateMessage({
      channelId: route.channelId,
      phone: String(payload.phone ?? ""),
      name: route.templateName,
      language: route.language,
      named: names.length > 0 && !numeric,
      parameters,
    });
    await recordDispatch({
      channelId: sent.channelId,
      phone: sent.phone,
      templateName: route.templateName,
      language: route.language,
      messageId: sent.messageId,
      category: route.category,
    });
    revalidatePath("/interacoes");
    revalidatePath("/gastos");
    revalidatePath("/rotas");
    return Response.json({ messageId: sent.messageId });
  } catch (error) {
    if (error instanceof OmniError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error(error instanceof Error ? error.message : "disparo");
    return Response.json({ error: "Não foi possível disparar o template." }, { status: 500 });
  }
}
