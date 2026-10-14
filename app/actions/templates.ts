"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { OmniError, createMessageTemplate, syncTemplates } from "@/lib/omni";
import { statusLabel } from "@/lib/templates";

export type TemplateFormState = {
  error?: string;
  notice?: string;
};

function examplesFrom(formData: FormData) {
  const examples: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("example:") && typeof value === "string") {
      examples[key.slice("example:".length)] = value;
    }
  }
  return examples;
}

export async function createTemplateAction(
  _state: TemplateFormState | undefined,
  formData: FormData,
): Promise<TemplateFormState> {
  await requirePage("templates");

  try {
    const created = await createMessageTemplate({
      wabaId: String(formData.get("wabaId") ?? ""),
      name: String(formData.get("name") ?? ""),
      category: String(formData.get("category") ?? ""),
      language: String(formData.get("language") ?? ""),
      body: String(formData.get("body") ?? ""),
      footer: String(formData.get("footer") ?? ""),
      examples: examplesFrom(formData),
    });
    revalidatePath("/templates");
    return {
      notice: `Template enviado. Situação: ${statusLabel(created.status)}.`,
    };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof OmniError) {
      return { error: error.message };
    }
    return { error: "Não foi possível criar o template agora." };
  }
}

export async function syncTemplatesAction(
  _state: TemplateFormState | undefined,
  formData: FormData,
): Promise<TemplateFormState> {
  await requirePage("templates");

  try {
    await syncTemplates(String(formData.get("wabaId") ?? ""));
    revalidatePath("/templates");
    return { notice: "Aprovação atualizada com a Meta." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof OmniError) {
      return { error: error.message };
    }
    return { error: "Não foi possível atualizar a aprovação agora." };
  }
}
