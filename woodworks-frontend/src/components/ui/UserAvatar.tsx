import { getAvatar } from './avatars';

type Props = {
  email: string | null;
  avatarId: string | null;
  size?: number; // px
};

export default function UserAvatar({ email, avatarId, size = 28 }: Props) {
  const avatar = getAvatar(avatarId);

  if (avatar) {
    return (
      <div
        aria-hidden="true"
        className="shrink-0 rounded-full flex items-center justify-center overflow-hidden select-none"
        style={{ width: size, height: size, backgroundColor: avatar.bg, fontSize: size * 0.55, lineHeight: 1 }}
      >
        {avatar.src ? <img src={avatar.src} alt="" className="w-full h-full object-cover" /> : avatar.emoji}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-full bg-[#BF5700] text-white font-semibold uppercase flex items-center justify-center select-none"
      style={{ width: size, height: size, fontSize: size * 0.43 }}
    >
      {(email ?? '?').charAt(0)}
    </div>
  );
}