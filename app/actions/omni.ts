"use server";

import { unstable_rethrow } from "next/navigation";
import { isChannelType } from "@/lib/channel-types";
import { requirePage } from "@/lib/auth";
import { OmniError, createChannel } from "@/lib/omni";

export type OmniFormState = {
  error?: string;
  channelId?: string;
};

export async function createChannelAction(
  _state: OmniFormState | undefined,
  formData: FormData,
): Promise<OmniFormState> {
  await requirePage("canais");
  const type = String(formData.get("type") ?? "");
  if (!isChannelType(type)) {
    return { error: "Escolha um tipo de canal." };
  }

  try {
    const channelId = await createChannel({
      name: String(formData.get("name") ?? ""),
      type,
    });
    return { channelId };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof OmniError) {
      return { error: error.message };
    }
    return { error: "Não foi possível criar o canal agora." };
  }
}
