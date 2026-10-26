import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { AVATARS } from '../ui/avatars';
import UserAvatar from '../ui/UserAvatar';

type Props = {
  email: string | null;
  currentId: string | null;
  onSave: (id: string | null) => void;
  onClose: () => void;
};

export default function AvatarPickerModal({ email, currentId, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(currentId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tile = (active: boolean) =>
    `relative flex flex-col items-center gap-1.5 rounded p-2 border-2 transition-colors cursor-pointer ${
      active ? 'border-[#212529] bg-[#F8F9FA]' : 'border-transparent hover:bg-[#2125290F]'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-picker-title"
        className="bg-white rounded-md w-full max-w-sm shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F] p-6 text-[#212529]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="avatar-picker-title" className="text-lg font-semibold">Choose your profile picture</h2>
            <p className="text-xs text-[#5C636A] mt-0.5">Pick an animal, or keep the default letter.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded text-[#495057] hover:bg-[#2125290F] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {/* Default: first letter of the email */}
          <button type="button" onClick={() => setSelected(null)} aria-pressed={selected === null} className={tile(selected === null)}>
            <UserAvatar email={email} avatarId={null} size={44} />
            <span className="text-[11px] text-[#495057]">Default</span>
            {selected === null && <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-[#212529]" />}
          </button>

          {AVATARS.map((a) => (
            <button key={a.id} type="button" onClick={() => setSelected(a.id)} aria-pressed={selected === a.id} className={tile(selected === a.id)}>
              <UserAvatar email={email} avatarId={a.id} size={44} />
              <span className="text-[11px] text-[#495057]">{a.label}</span>
              {selected === a.id && <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-[#212529]" />}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(selected)}
            className="h-9 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}