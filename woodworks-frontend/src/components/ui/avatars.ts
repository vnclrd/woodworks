export type AvatarOption = {
  id: string;
  label: string;
  bg: string;
  emoji?: string;
  src?: string;
};

export const AVATARS: AvatarOption[] = [
  { id: 'cat', label: 'Cat', emoji: '🐱', bg: '#FFE8D1' },
  { id: 'dog', label: 'Dog', emoji: '🐶', bg: '#F1E4D3' },
  { id: 'fox', label: 'Fox', emoji: '🦊', bg: '#FFD9C2' },
  { id: 'panda', label: 'Panda', emoji: '🐼', bg: '#E9ECEF' },
  { id: 'koala', label: 'Koala', emoji: '🐨', bg: '#DEE2E6' },
  { id: 'rabbit', label: 'Rabbit', emoji: '🐰', bg: '#FDE2EC' },
  { id: 'bear', label: 'Bear', emoji: '🐻', bg: '#EBD9C6' },
  { id: 'frog', label: 'Frog', emoji: '🐸', bg: '#D9F2DF' },
  { id: 'penguin', label: 'Penguin', emoji: '🐧', bg: '#D6E9FB' },
  { id: 'lion', label: 'Lion', emoji: '🦁', bg: '#FFF1C2' },
  { id: 'tiger', label: 'Tiger', emoji: '🐯', bg: '#FFE3B8' },
  { id: 'monkey', label: 'Monkey', emoji: '🐵', bg: '#F3E0CC' },
];

// Returns null for unknown/removed ids, so the UI falls back to the email's first letter
export const getAvatar = (id: string | null | undefined): AvatarOption | null =>
  AVATARS.find((a) => a.id === id) ?? null;