"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { isChannelType } from "@/lib/channel-types";
import { deleteChannel, saveChannel } from "@/lib/channels";

export type ChannelFormState = {
  error?: string;
  saved?: boolean;
};

export async function saveChannelAction(
  _state: ChannelFormState | undefined,
  formData: FormData,
): Promise<ChannelFormState> {
  await requirePage("canais");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const id = String(formData.get("channelId") ?? "").trim();

  if (name.length < 2 || name.length > 120) {
    return { error: "Dê um nome de 2 a 120 caracteres." };
  }
  if (!isChannelType(type)) {
    return { error: "Escolha um tipo de canal." };
  }
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) {
    return { error: "Cole o identificador do canal criado no painel da Omni." };
  }

  try {
    await saveChannel({ id, name, type });
  } catch (error) {
    unstable_rethrow(error);
    return { error: "Não foi possível registrar o canal agora." };
  }

  revalidatePath("/canais");
  revalidatePath("/interacoes");
  revalidatePath("/rotas");
  return { saved: true };
}

export async function deleteChannelAction(id: string) {
  await requirePage("canais");
  await deleteChannel(id);
  revalidatePath("/canais");
  revalidatePath("/interacoes");
  revalidatePath("/rotas");
}
