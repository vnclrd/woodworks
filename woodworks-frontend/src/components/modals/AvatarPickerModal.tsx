import { AlertTriangle, Check, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BASE_URL } from '../../config/appConfig'; // Adjust relative path to your config if necessary
import { AVATARS } from '../ui/avatars';
import UserAvatar from '../ui/UserAvatar';

type Props = {
  email: string | null;
  currentId: string | null;
  onSave: (id: string | null) => void;
  onClose: () => void;
};

export default function AvatarPickerModal({
  email,
  currentId,
  onSave,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<string | null>(currentId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (email) {
        const res = await fetch(
          `${BASE_URL.replace(/\/$/, '')}/api/auth/update-avatar`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, avatar: selected }),
          },
        );

        if (!res.ok) throw new Error('Failed to update avatar on the server.');
      }

      // Notify parent component of the new avatar state and close
      onSave(selected);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  const tile = (active: boolean) =>
    `relative flex flex-col items-center gap-1.5 rounded p-2 border-2 transition-colors cursor-pointer ${
      active ? 'border-fg bg-subtle' : 'border-transparent hover:bg-tint'
    }`;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]'
      onClick={onClose}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='avatar-picker-title'
        className='bg-surface rounded-md w-full max-w-sm shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F] p-6 text-fg'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start justify-between mb-4'>
          <div>
            <h2 id='avatar-picker-title' className='text-lg font-semibold'>
              Choose your profile picture
            </h2>
            <p className='text-xs text-fg-3 mt-0.5'>
              Pick an animal, or keep the default letter.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='p-1.5 rounded text-fg-2 hover:bg-tint cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        {error && (
          <div
            role='alert'
            className='mb-4 flex items-start gap-2.5 p-3 bg-danger-bg border border-[#C9372C33] text-danger text-sm rounded'
          >
            <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
            <span>{error}</span>
          </div>
        )}

        <div className='grid grid-cols-4 gap-1.5 mb-5'>
          {/* Default: first letter of the email */}
          <button
            type='button'
            onClick={() => setSelected(null)}
            aria-pressed={selected === null}
            className={tile(selected === null)}
          >
            <UserAvatar email={email} avatarId={null} size={44} />
            <span className='text-[11px] text-fg-2'>Default</span>
            {selected === null && (
              <Check className='absolute top-1 right-1 w-3.5 h-3.5 text-fg' />
            )}
          </button>

          {AVATARS.map((a) => (
            <button
              key={a.id}
              type='button'
              onClick={() => setSelected(a.id)}
              aria-pressed={selected === a.id}
              className={tile(selected === a.id)}
            >
              <UserAvatar email={email} avatarId={a.id} size={44} />
              <span className='text-[11px] text-fg-2'>{a.label}</span>
              {selected === a.id && (
                <Check className='absolute top-1 right-1 w-3.5 h-3.5 text-fg' />
              )}
            </button>
          ))}
        </div>

        <div className='flex items-center justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            disabled={isLoading}
            className='h-9 px-3 rounded text-sm font-medium text-fg-2 hover:bg-tint cursor-pointer disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={isLoading}
            className='h-9 px-3 flex items-center justify-center gap-2 rounded bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
          >
            {isLoading && <RefreshCw className='w-3.5 h-3.5 animate-spin' />}
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
