import "server-only";
import type { RowDataPacket } from "mysql2";
import mysql from "mysql2/promise";

const SCHEMA_VERSION = 9;

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
  mysqlReady?: Promise<void>;
  schemaVersion?: number;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável ${name} não configurada.`);
  }
  return value;
}

export function getPool() {
  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = mysql.createPool({
      host: required("DB_HOST"),
      port: Number(process.env.DB_PORT ?? 3306),
      user: required("DB_USER"),
      password: required("DB_PASSWORD"),
      database: required("DB_NAME"),
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 12000,
      charset: "utf8mb4",
    });
  }

  return globalForDb.mysqlPool;
}

async function columnExists(table: string, column: string) {
  const [rows] = await getPool().query<RowDataPacket[]>(
    `SHOW COLUMNS FROM \`${table}\` LIKE ?`,
    [column],
  );
  return rows.length > 0;
}

async function addColumn(table: string, column: string, definition: string) {
  if (await columnExists(table, column)) {
    return;
  }

  try {
    await getPool().query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_FIELDNAME"
    ) {
      return;
    }
    throw error;
  }
}

async function migrate() {
  const pool = getPool();

  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) NOT NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      access_type VARCHAR(16) NOT NULL DEFAULT 'admin',
      access_name VARCHAR(80) NOT NULL DEFAULT 'Admin',
      avatar VARCHAR(32) NOT NULL DEFAULT '1',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await addColumn("users", "access_type", "VARCHAR(16) NOT NULL DEFAULT 'admin'");
  await addColumn("users", "access_name", "VARCHAR(80) NOT NULL DEFAULT 'Admin'");
  await addColumn("users", "avatar", "VARCHAR(32) NOT NULL DEFAULT '1'");

  await pool.query(
    `CREATE TABLE IF NOT EXISTS user_pages (
      user_id CHAR(36) NOT NULL,
      page_id VARCHAR(64) NOT NULL,
      PRIMARY KEY (user_id, page_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS interactions (
      id CHAR(36) NOT NULL,
      channel_id VARCHAR(80) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      template_name VARCHAR(512) NOT NULL,
      language VARCHAR(16) NOT NULL,
      message_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY interactions_phone (phone, channel_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS interaction_events (
      id CHAR(36) NOT NULL,
      interaction_id CHAR(36) NOT NULL,
      external_id VARCHAR(80) NOT NULL,
      direction VARCHAR(16) NOT NULL,
      event_type VARCHAR(64) NOT NULL,
      summary VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY interaction_events_external (external_id),
      KEY interaction_events_interaction (interaction_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await addColumn("interactions", "category", "VARCHAR(32) NOT NULL DEFAULT 'OUTROS'");

  await pool.query(
    `CREATE TABLE IF NOT EXISTS send_rates (
      category VARCHAR(32) NOT NULL,
      price_cents INT NOT NULL,
      PRIMARY KEY (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS api_routes (
      id CHAR(36) NOT NULL,
      name VARCHAR(80) NOT NULL,
      kind VARCHAR(16) NOT NULL,
      token VARCHAR(64) NOT NULL,
      channel_id VARCHAR(80) NOT NULL DEFAULT '',
      template_name VARCHAR(512) NOT NULL DEFAULT '',
      language VARCHAR(16) NOT NULL DEFAULT '',
      category VARCHAR(32) NOT NULL DEFAULT 'OUTROS',
      body TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS channels (
      id VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      type VARCHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS route_messages (
      id CHAR(36) NOT NULL,
      route_id CHAR(36) NOT NULL,
      external_id VARCHAR(80) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      direction VARCHAR(16) NOT NULL,
      summary VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY route_messages_external (route_id, external_id),
      KEY route_messages_route (route_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

export function ensureDatabase() {
  if (
    globalForDb.schemaVersion === SCHEMA_VERSION &&
    globalForDb.mysqlReady
  ) {
    return globalForDb.mysqlReady;
  }

  let resolveReady: () => void = () => undefined;
  let rejectReady: (error: unknown) => void = () => undefined;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  globalForDb.mysqlReady = ready;
  globalForDb.schemaVersion = SCHEMA_VERSION;

  void migrate()
    .then(() => {
      resolveReady();
    })
    .catch((error) => {
      if (globalForDb.mysqlReady === ready) {
        globalForDb.mysqlReady = undefined;
        globalForDb.schemaVersion = 0;
      }
      rejectReady(error);
    });

  return ready;
}
