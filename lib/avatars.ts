export const avatars = [
  { id: "1", label: "Ícone 1" },
  { id: "2", label: "Ícone 2" },
  { id: "3", label: "Ícone 3" },
  { id: "4", label: "Ícone 4" },
  { id: "5", label: "Ícone 5" },
  { id: "6", label: "Ícone 6" },
  { id: "7", label: "Ícone 7" },
  { id: "8", label: "Ícone 8" },
  { id: "9", label: "Ícone 9" },
  { id: "10", label: "Ícone 10" },
  { id: "11", label: "Ícone 11" },
  { id: "12", label: "Ícone 12" },
] as const;

export type AvatarId = (typeof avatars)[number]["id"];

const defaultAvatar = avatars[0];

export function isAvatarId(id: string): id is AvatarId {
  return avatars.some((avatar) => avatar.id === id);
}

export function avatarById(id: string) {
  return avatars.find((avatar) => avatar.id === id) ?? defaultAvatar;
}
