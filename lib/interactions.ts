import "server-only";
import { io } from "next/cache";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { ensureDatabase, getPool } from "@/lib/db";

export type InteractionEvent = {
  id: string;
  direction: string;
  eventType: string;
  summary: string;
  createdAt: Date;
};

export type InteractionRecord = {
  id: string;
  channelId: string;
  phone: string;
  templateName: string;
  language: string;
  messageId: string;
  createdAt: Date;
  events: InteractionEvent[];
};

type InteractionRow = RowDataPacket & {
  id: string;
  channel_id: string;
  phone: string;
  template_name: string;
  language: string;
  message_id: string;
  created_at: Date;
};

type EventRow = RowDataPacket & {
  id: string;
  interaction_id: string;
  direction: string;
  event_type: string;
  summary: string;
  created_at: Date;
};

async function prepareRead() {
  await io();
  await ensureDatabase();
}

export async function listInteractions() {
  await prepareRead();
  const [rows] = await getPool().query<InteractionRow[]>(
    `SELECT id, channel_id, phone, template_name, language, message_id, created_at
     FROM interactions
     ORDER BY created_at DESC
     LIMIT 100`,
  );
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => row.id);
  const [events] = await getPool().query<EventRow[]>(
    `SELECT id, interaction_id, direction, event_type, summary, created_at
     FROM interaction_events
     WHERE interaction_id IN (${ids.map(() => "?").join(", ")})
     ORDER BY created_at ASC`,
    ids,
  );
  const grouped = new Map<string, InteractionEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.interaction_id) ?? [];
    list.push({
      id: event.id,
      direction: event.direction,
      eventType: event.event_type,
      summary: event.summary,
      createdAt: new Date(event.created_at),
    });
    grouped.set(event.interaction_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    channelId: row.channel_id,
    phone: row.phone,
    templateName: row.template_name,
    language: row.language,
    messageId: row.message_id,
    createdAt: new Date(row.created_at),
    events: grouped.get(row.id) ?? [],
  }));
}

export type ConversationMessage = {
  id: string;
  direction: "enviada" | "recebida" | "template";
  summary: string;
  createdAt: Date;
};

export type Conversation = {
  id: string;
  phone: string;
  channelId: string;
  templateName: string;
  language: string;
  startedAt: Date;
  lastAt: Date;
  preview: string;
  messages: ConversationMessage[];
};

export async function listConversations() {
  const interactions = await listInteractions();
  const groups = new Map<string, InteractionRecord[]>();

  for (const item of [...interactions].reverse()) {
    const key = `${item.channelId}:${item.phone}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const conversations: Conversation[] = [];
  for (const group of groups.values()) {
    const starter = group[0];
    if (!starter) {
      continue;
    }
    const messages: ConversationMessage[] = group.flatMap((item, index) => {
      const opened: ConversationMessage = {
        id: `template-${item.id}`,
        direction: "template",
        summary:
          index === 0
            ? `Conversa iniciada pelo template ${item.templateName}.`
            : `Novo disparo do template ${item.templateName}.`,
        createdAt: item.createdAt,
      };
      return [
        opened,
        ...item.events.map((event) => ({
          id: event.id,
          direction: event.direction === "recebida" ? ("recebida" as const) : ("enviada" as const),
          summary: event.summary,
          createdAt: event.createdAt,
        })),
      ];
    });
    messages.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    const last = messages[messages.length - 1] ?? {
      summary: starter.templateName,
      createdAt: starter.createdAt,
    };
    conversations.push({
      id: starter.id,
      phone: starter.phone,
      channelId: starter.channelId,
      templateName: starter.templateName,
      language: starter.language,
      startedAt: starter.createdAt,
      lastAt: last.createdAt,
      preview: last.summary,
      messages,
    });
  }

  conversations.sort((left, right) => right.lastAt.getTime() - left.lastAt.getTime());
  return conversations;
}

export async function recordDispatch(input: {
  channelId: string;
  phone: string;
  templateName: string;
  language: string;
  messageId: string;
  category: string;
}) {
  await io();
  await ensureDatabase();
  await getPool().execute(
    `INSERT INTO interactions
      (id, channel_id, phone, template_name, language, message_id, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      input.channelId,
      input.phone,
      input.templateName,
      input.language,
      input.messageId,
      input.category,
    ],
  );
}

function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
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
  if (typeof value.type === "string") {
    return value.type;
  }
  return "";
}

export async function recordIncoming(payload: unknown) {
  if (!isRecord(payload)) {
    return;
  }
  const message = isRecord(payload.message) ? payload.message : payload;
  const externalId = typeof message._id === "string" ? message._id.trim() : "";
  if (!externalId || externalId.length > 80) {
    return;
  }

  const metadata = isRecord(message.metadata) ? message.metadata : {};
  const fromMe = metadata.from_me === true;
  const sender = isRecord(message.sender) ? message.sender : {};
  const recipient = isRecord(message.recipient) ? message.recipient : {};
  const phone = digits(fromMe ? recipient.identifier : sender.identifier);
  const channelId = typeof message.channel_id === "string" ? message.channel_id : "";
  if (!phone) {
    return;
  }

  await io();
  await ensureDatabase();
  const pool = getPool();
  const [matches] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM interactions
     WHERE phone = ? AND (channel_id = ? OR channel_id = '')
     ORDER BY created_at ASC
     LIMIT 1`,
    [phone, channelId],
  );
  const interactionId = typeof matches[0]?.id === "string" ? matches[0].id : "";
  if (!interactionId) {
    return;
  }

  const contents = Array.isArray(message.contents) ? message.contents : [];
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const summary = (
    textOf(contents[0]) ||
    textOf(attachments[0]) ||
    (typeof payload.messageEventType === "string" ? payload.messageEventType : "Mensagem")
  ).slice(0, 500);
  const eventType = (
    typeof payload.messageEventType === "string" ? payload.messageEventType : "NEW_MESSAGE"
  ).slice(0, 64);

  await pool.execute(
    `INSERT INTO interaction_events
      (id, interaction_id, external_id, direction, event_type, summary)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      summary = VALUES(summary),
      direction = VALUES(direction),
      event_type = VALUES(event_type)`,
    [
      randomUUID(),
      interactionId,
      externalId,
      fromMe ? "enviada" : "recebida",
      eventType,
      summary,
    ],
  );
}
