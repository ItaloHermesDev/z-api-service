export const RATE_CATEGORIES = [
  { id: "MARKETING", label: "Marketing" },
  { id: "UTILITY", label: "Utilidade" },
  { id: "AUTHENTICATION", label: "Autenticação" },
  { id: "OUTROS", label: "Sem categoria" },
] as const;

export type RateCategory = (typeof RATE_CATEGORIES)[number]["id"];

export function rateCategory(value: string): RateCategory {
  const found = RATE_CATEGORIES.find((item) => item.id === value);
  return found?.id ?? "OUTROS";
}

export function rateLabel(category: string) {
  return RATE_CATEGORIES.find((item) => item.id === category)?.label ?? "Sem categoria";
}

export function parseReais(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) {
    return 0;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents) || cents > 100_000) {
    return null;
  }
  return cents;
}

export function formatReais(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
