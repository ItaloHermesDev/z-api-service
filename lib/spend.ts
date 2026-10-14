import "server-only";
import { io } from "next/cache";
import type { RowDataPacket } from "mysql2";
import { ensureDatabase, getPool } from "@/lib/db";
import { RATE_CATEGORIES, rateCategory, type RateCategory } from "@/lib/rates";

export type SpendRow = {
  templateName: string;
  language: string;
  category: RateCategory;
  sends: number;
  priceCents: number;
  totalCents: number;
};

type SpendQueryRow = RowDataPacket & {
  template_name: string;
  language: string;
  category: string;
  sends: number;
};

type RateRow = RowDataPacket & {
  category: string;
  price_cents: number;
};

async function prepareRead() {
  await io();
  await ensureDatabase();
}

export async function listRates() {
  await prepareRead();
  const [rows] = await getPool().query<RateRow[]>(
    "SELECT category, price_cents FROM send_rates",
  );
  const rates = Object.fromEntries(RATE_CATEGORIES.map((item) => [item.id, 0])) as Record<
    RateCategory,
    number
  >;
  for (const row of rows) {
    const category = rateCategory(row.category);
    rates[category] = Number(row.price_cents) || 0;
  }
  return rates;
}

export async function listSpend() {
  await prepareRead();
  const rates = await listRates();
  const [rows] = await getPool().query<SpendQueryRow[]>(
    `SELECT template_name, language, category, COUNT(*) AS sends
     FROM interactions
     GROUP BY template_name, language, category`,
  );

  const grouped = new Map<string, SpendRow>();
  for (const row of rows) {
    const key = `${row.template_name}\n${row.language}`;
    const sends = Number(row.sends) || 0;
    const category = rateCategory(String(row.category ?? ""));
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        templateName: row.template_name,
        language: row.language,
        category,
        sends,
        priceCents: 0,
        totalCents: 0,
      });
      continue;
    }
    current.sends += sends;
    if (current.category === "OUTROS" && category !== "OUTROS") {
      current.category = category;
    }
  }

  const items = [...grouped.values()]
    .map((item) => {
      const priceCents = rates[item.category];
      return { ...item, priceCents, totalCents: item.sends * priceCents };
    })
    .sort((left, right) => right.sends - left.sends || left.templateName.localeCompare(right.templateName));

  return {
    rates,
    items,
    sends: items.reduce((sum, item) => sum + item.sends, 0),
    totalCents: items.reduce((sum, item) => sum + item.totalCents, 0),
  };
}

export async function saveRates(rates: Record<RateCategory, number>) {
  await io();
  await ensureDatabase();
  const pool = getPool();
  for (const category of RATE_CATEGORIES) {
    await pool.execute(
      `INSERT INTO send_rates (category, price_cents) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE price_cents = VALUES(price_cents)`,
      [category.id, rates[category.id]],
    );
  }
}
