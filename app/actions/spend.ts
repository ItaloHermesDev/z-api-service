"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { RATE_CATEGORIES, parseReais, type RateCategory } from "@/lib/rates";
import { saveRates } from "@/lib/spend";

export type RateFormState = {
  error?: string;
  saved?: boolean;
};

export async function saveRatesAction(
  _state: RateFormState | undefined,
  formData: FormData,
): Promise<RateFormState> {
  await requirePage("gastos");

  const rates = {} as Record<RateCategory, number>;
  for (const category of RATE_CATEGORIES) {
    const cents = parseReais(String(formData.get(category.id) ?? ""));
    if (cents === null) {
      return { error: `Informe o preço de ${category.label} em reais, com até dois decimais.` };
    }
    rates[category.id] = cents;
  }

  try {
    await saveRates(rates);
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Não foi possível salvar os preços agora." };
  }

  revalidatePath("/gastos");
  return { saved: true };
}
