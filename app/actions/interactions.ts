"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { recordDispatch } from "@/lib/interactions";
import { OmniError, sendTemplateMessage } from "@/lib/omni";
import { placeholders } from "@/lib/templates";
import { rateCategory } from "@/lib/rates";

export type DispatchState = {
  error?: string;
  notice?: string;
};

function examplesFrom(formData: FormData) {
  const examples: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("example:") && typeof value === "string") {
      examples[key.slice("example:".length)] = value.trim();
    }
  }
  return examples;
}

export async function dispatchTemplateAction(
  _state: DispatchState | undefined,
  formData: FormData,
): Promise<DispatchState> {
  await requirePage("interacoes");

  const template = String(formData.get("template") ?? "");
  const splitAt = template.lastIndexOf("|");
  const name = splitAt > 0 ? template.slice(0, splitAt) : "";
  const language = splitAt > 0 ? template.slice(splitAt + 1) : "";
  const body = String(formData.get("body") ?? "");
  const names = placeholders(body);
  const examples = examplesFrom(formData);
  const missing = names.find((item) => !examples[item]);
  if (!name || !language) {
    return { error: "Escolha um template aprovado." };
  }
  if (missing) {
    return { error: `Informe o valor de {{${missing}}}.` };
  }

  const numeric = names.every((item) => /^\d+$/.test(item));
  const ordered = numeric
    ? [...names].sort((left, right) => Number(left) - Number(right))
    : names;

  try {
    const sent = await sendTemplateMessage({
      channelId: String(formData.get("channelId") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      name,
      language,
      named: names.length > 0 && !numeric,
      parameters: ordered.map((item) => ({ name: item, text: examples[item] ?? "" })),
    });
    await recordDispatch({
      channelId: sent.channelId,
      phone: sent.phone,
      templateName: name,
      language,
      messageId: sent.messageId,
      category: rateCategory(String(formData.get("category") ?? "")),
    });
    revalidatePath("/interacoes");
    revalidatePath("/gastos");
    return { notice: `Template disparado. Mensagem ${sent.messageId}.` };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof OmniError) {
      return { error: error.message };
    }
    return { error: "Não foi possível disparar o template agora." };
  }
}
