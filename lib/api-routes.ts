import "server-only";
import { io } from "next/cache";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { ensureDatabase, getPool } from "@/lib/db";

export type ApiRouteKind = "receber" | "disparar";

export type ApiRouteRecord = {
  id: string;
  name: string;
  kind: ApiRouteKind;
  token: string;
  channelId: string;
  templateName: string;
  language: string;
  category: string;
  body: string;
  createdAt: Date;
  messages: { id: string; phone: string; direction: string; summary: string; createdAt: Date }[];
};

type RouteRow = RowDataPacket & {
  id: string;
  name: string;
  kind: string;
  token: string;
  channel_id: string;
  template_name: string;
  language: string;
  category: string;
  body: string;
  created_at: Date;
};

type MessageRow = RowDataPacket & {
  id: string;
  route_id: string;
  phone: string;
  direction: string;
  summary: string;
  created_at: Date;
};

async function prepareRead() {
  await io();
  await ensureDatabase();
}

function mapRoute(row: RouteRow): ApiRouteRecord {
  const kind: ApiRouteKind = row.kind === "disparar" ? "disparar" : "receber";
  return {
    id: row.id,
    name: row.name,
    kind,
    token: row.token,
    channelId: row.channel_id,
    templateName: row.template_name,
    language: row.language,
    category: row.category,
    body: row.body,
    createdAt: new Date(row.created_at),
    messages: [],
  };
}

export function newRouteToken() {
  return randomBytes(24).toString("base64url");
}

export function routeTokenMatches(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function listRoutes() {
  await prepareRead();
  const [rows] = await getPool().query<RouteRow[]>(
    `SELECT id, name, kind, token, channel_id, template_name, language, category, body, created_at
     FROM api_routes
     ORDER BY created_at DESC`,
  );
  const routes = rows.map(mapRoute);
  if (routes.length === 0) {
    return routes;
  }
  const ids = routes.map((route) => route.id);
  const [messages] = await getPool().query<MessageRow[]>(
    `SELECT id, route_id, phone, direction, summary, created_at
     FROM route_messages
     WHERE route_id IN (${ids.map(() => "?").join(", ")})
     ORDER BY created_at DESC`,
    ids,
  );
  const grouped = new Map<string, ApiRouteRecord["messages"]>();
  for (const message of messages) {
    const list = grouped.get(message.route_id) ?? [];
    if (list.length >= 5) {
      continue;
    }
    list.push({
      id: message.id,
      phone: message.phone,
      direction: message.direction,
      summary: message.summary,
      createdAt: new Date(message.created_at),
    });
    grouped.set(message.route_id, list);
  }
  return routes.map((route) => ({ ...route, messages: grouped.get(route.id) ?? [] }));
}

export async function findRoute(id: string) {
  await io();
  await ensureDatabase();
  const [rows] = await getPool().execute<RouteRow[]>(
    `SELECT id, name, kind, token, channel_id, template_name, language, category, body, created_at
     FROM api_routes WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = rows[0];
  return row ? mapRoute(row) : null;
}

export async function createRoute(input: {
  name: string;
  kind: ApiRouteKind;
  channelId: string;
  templateName: string;
  language: string;
  category: string;
  body: string;
}) {
  await io();
  await ensureDatabase();
  const id = randomUUID();
  const token = newRouteToken();
  await getPool().execute(
    `INSERT INTO api_routes
      (id, name, kind, token, channel_id, template_name, language, category, body)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.kind,
      token,
      input.channelId,
      input.templateName,
      input.language,
      input.category,
      input.body,
    ],
  );
  return { id, token };
}

export async function deleteRoute(id: string) {
  await io();
  await ensureDatabase();
  const pool = getPool();
  await pool.execute("DELETE FROM route_messages WHERE route_id = ?", [id]);
  await pool.execute("DELETE FROM api_routes WHERE id = ?", [id]);
}

export async function rememberRouteMessage(input: {
  routeId: string;
  externalId: string;
  phone: string;
  direction: string;
  summary: string;
}) {
  await io();
  await ensureDatabase();
  await getPool().execute(
    `INSERT INTO route_messages (id, route_id, external_id, phone, direction, summary)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE summary = VALUES(summary), direction = VALUES(direction)`,
    [
      randomUUID(),
      input.routeId,
      input.externalId.slice(0, 80),
      input.phone.slice(0, 32),
      input.direction.slice(0, 16),
      input.summary.slice(0, 500),
    ],
  );
}
