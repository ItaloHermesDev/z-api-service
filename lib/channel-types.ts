export const CHANNEL_TYPES = [
  { id: "META_WHATSAPP", label: "WhatsApp oficial (Meta)" },
  { id: "Z_API_WHATSAPP", label: "WhatsApp Web" },
  { id: "META_INSTAGRAM", label: "Instagram" },
  { id: "META_MESSENGER", label: "Messenger" },
  { id: "BOT_TELEGRAM", label: "Telegram" },
] as const;

export type ChannelType = (typeof CHANNEL_TYPES)[number]["id"];

export function isChannelType(value: string): value is ChannelType {
  return CHANNEL_TYPES.some((type) => type.id === value);
}
