import "server-only";
import { io } from "next/cache";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { isChannelType, type ChannelType } from "@/lib/channel-types";
import { ensureDatabase, getPool } from "@/lib/db";

export type SavedChannel = {
  id: string;
  name: string;
  type: ChannelType;
  createdAt: Date;
};

type ChannelRow = RowDataPacket & {
  id: string;
  name: string;
  type: string;
  created_at: Date;
};

async function prepareRead() {
  await io();
  await ensureDatabase();
}

function mapChannel(row: ChannelRow): SavedChannel | null {
  if (!isChannelType(row.type)) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    createdAt: new Date(row.created_at),
  };
}

export async function listChannels() {
  await prepareRead();
  const [rows] = await getPool().query<ChannelRow[]>(
    "SELECT id, name, type, created_at FROM channels ORDER BY created_at ASC",
  );
  return rows.flatMap((row) => {
    const channel = mapChannel(row);
    return channel ? [channel] : [];
  });
}

export async function saveChannel(input: { id: string; name: string; type: ChannelType }) {
  await io();
  await ensureDatabase();
  await getPool().execute(
    `INSERT INTO channels (id, name, type) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type)`,
    [input.id, input.name, input.type],
  );
}

export async function deleteChannel(id: string) {
  await io();
  await ensureDatabase();
  const [result] = await getPool().execute<ResultSetHeader>("DELETE FROM channels WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
