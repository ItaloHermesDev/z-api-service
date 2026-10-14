import "server-only";
import { io } from "next/cache";
import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { ensureDatabase, getPool } from "@/lib/db";
import { avatarById } from "@/lib/avatars";
import { assignablePages } from "@/lib/pages";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  accessName: string;
  pageIds: string[];
  avatar: string;
  createdAt: Date;
};

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  access_type: string;
  access_name: string;
  avatar: string;
  created_at: Date;
};

type PageRow = RowDataPacket & {
  user_id: string;
  page_id: string;
};

const allowedPageIds = new Set(assignablePages().map((page) => page.id));

export function sanitizePageIds(pageIds: string[]) {
  return [...new Set(pageIds.filter((pageId) => allowedPageIds.has(pageId)))];
}

function mapUser(row: UserRow, pageIds: string[]): UserRecord {
  const isAdmin = row.access_type === "admin";
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isAdmin,
    accessName: isAdmin ? "Admin" : row.access_name,
    pageIds: isAdmin ? [] : sanitizePageIds(pageIds),
    avatar: avatarById(row.avatar).id,
    createdAt: row.created_at,
  };
}

async function pagesByUser(userIds: string[]) {
  const grouped = new Map<string, string[]>();
  if (userIds.length === 0) {
    return grouped;
  }

  const marks = userIds.map(() => "?").join(", ");
  const [rows] = await getPool().query<PageRow[]>(
    `SELECT user_id, page_id FROM user_pages WHERE user_id IN (${marks})`,
    userIds,
  );

  for (const row of rows) {
    const current = grouped.get(row.user_id) ?? [];
    current.push(row.page_id);
    grouped.set(row.user_id, current);
  }

  return grouped;
}

export function isDuplicateEmail(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

async function prepareRead() {
  await io();
  await ensureDatabase();
}

export async function countUsers() {
  await prepareRead();
  const [rows] = await getPool().query<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM users",
  );
  return Number(rows[0]?.total ?? 0);
}

export async function countAdmins() {
  await prepareRead();
  const [rows] = await getPool().query<Array<RowDataPacket & { total: number }>>(
    "SELECT COUNT(*) AS total FROM users WHERE access_type = 'admin'",
  );
  return Number(rows[0]?.total ?? 0);
}

export async function findUserByEmail(email: string) {
  await prepareRead();
  const [rows] = await getPool().execute<UserRow[]>(
    `SELECT id, name, email, password_hash, access_type, access_name, avatar, created_at
     FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }

  const pages = await pagesByUser([row.id]);
  return mapUser(row, pages.get(row.id) ?? []);
}

export async function findUserById(id: string) {
  await prepareRead();
  const [rows] = await getPool().execute<UserRow[]>(
    `SELECT id, name, email, password_hash, access_type, access_name, avatar, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }

  const pages = await pagesByUser([row.id]);
  return mapUser(row, pages.get(row.id) ?? []);
}

export async function listUsers() {
  await prepareRead();
  const [rows] = await getPool().query<UserRow[]>(
    `SELECT id, name, email, password_hash, access_type, access_name, avatar, created_at
     FROM users ORDER BY created_at ASC`,
  );
  const pages = await pagesByUser(rows.map((row) => row.id));
  return rows.map((row) => mapUser(row, pages.get(row.id) ?? []));
}

async function writePages(
  connection: Awaited<ReturnType<ReturnType<typeof getPool>["getConnection"]>>,
  userId: string,
  pageIds: string[],
) {
  await connection.execute("DELETE FROM user_pages WHERE user_id = ?", [userId]);
  for (const pageId of pageIds) {
    await connection.execute(
      "INSERT INTO user_pages (user_id, page_id) VALUES (?, ?)",
      [userId, pageId],
    );
  }
}

export async function createFirstAdmin(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  await ensureDatabase();
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<Array<RowDataPacket & { total: number }>>(
      "SELECT COUNT(*) AS total FROM users FOR UPDATE",
    );
    if (Number(rows[0]?.total ?? 0) > 0) {
      await connection.rollback();
      return { error: "exists" as const };
    }

    const id = randomUUID();
    await connection.execute(
      `INSERT INTO users (id, name, email, password_hash, access_type, access_name)
       VALUES (?, ?, ?, ?, 'admin', 'Admin')`,
      [id, input.name, input.email, input.passwordHash],
    );
    await connection.commit();
    return { id, name: input.name, email: input.email };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createManagedUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  accessName: string;
  pageIds: string[];
  avatar: string;
}) {
  await ensureDatabase();
  const connection = await getPool().getConnection();
  const id = randomUUID();
  const pageIds = input.isAdmin ? [] : sanitizePageIds(input.pageIds);

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO users (id, name, email, password_hash, access_type, access_name, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.email,
        input.passwordHash,
        input.isAdmin ? "admin" : "custom",
        input.isAdmin ? "Admin" : input.accessName,
        avatarById(input.avatar).id,
      ],
    );
    await writePages(connection, id, pageIds);
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateManagedUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  isAdmin: boolean;
  accessName: string;
  pageIds: string[];
  avatar: string;
}) {
  await ensureDatabase();
  const connection = await getPool().getConnection();
  const pageIds = input.isAdmin ? [] : sanitizePageIds(input.pageIds);

  try {
    await connection.beginTransaction();
    const passwordSql = input.passwordHash ? ", password_hash = ?" : "";
    const params: Array<string> = [
      input.name,
      input.email,
      input.isAdmin ? "admin" : "custom",
      input.isAdmin ? "Admin" : input.accessName,
      avatarById(input.avatar).id,
    ];
    if (input.passwordHash) {
      params.push(input.passwordHash);
    }
    params.push(input.id);

    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE users
       SET name = ?, email = ?, access_type = ?, access_name = ?, avatar = ?${passwordSql}
       WHERE id = ?`,
      params,
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await writePages(connection, input.id, pageIds);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteManagedUser(id: string) {
  await ensureDatabase();
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM user_pages WHERE user_id = ?", [id]);
    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM users WHERE id = ?",
      [id],
    );
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
