import { avatarById } from "@/lib/avatars";

export function AvatarMark({ id }: { id: string }) {
  const avatar = avatarById(id);

  return (
    <span className="kp-avatar">
      <img src={`/icones/${avatar.id}.png`} alt="" width={2000} height={2000} />
    </span>
  );
}
