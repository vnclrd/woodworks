import { ShieldAlert } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function DeleteAccountConfirmModal({ app }: Props) {
  const {
    isDeleteAccountConfirmOpen,
    setIsDeleteAccountConfirmOpen,
    deleteAccountPhrase,
    setDeleteAccountPhrase,
    handleDeleteAccount,
  } = app;

  return (
    <>
      {isDeleteAccountConfirmOpen && (
        <div
          className='fixed inset-0 z-55 flex items-center justify-center p-4 bg-[#212529A8]'
          onClick={() => setIsDeleteAccountConfirmOpen(false)}
        >
          <div
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-account-title'
            className='bg-surface rounded-md w-full max-w-sm p-6 shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='w-10 h-10 rounded bg-danger-bg text-danger flex items-center justify-center mb-4'>
              <ShieldAlert className='w-5 h-5' />
            </div>
            <h2 id='delete-account-title' className='text-lg font-semibold'>
              Confirm account deletion
            </h2>
            <p className='text-sm text-fg-2 mt-2'>
              This is a permanent action. All your tasks and account data will
              be permanently deleted.
            </p>
            <label
              htmlFor='delete-account-phrase'
              className='block text-xs font-semibold text-fg-2 mt-4 mb-1'
            >
              Type DELETE to confirm
            </label>
            <input
              id='delete-account-phrase'
              autoFocus
              value={deleteAccountPhrase}
              onChange={(e) => setDeleteAccountPhrase(e.target.value)}
              placeholder='DELETE'
              className='w-full h-10 bg-surface border-2 border-line rounded px-3 text-sm focus:outline-none focus:border-danger'
            />
            <div className='flex items-center justify-end gap-2 mt-6'>
              <button
                onClick={() => setIsDeleteAccountConfirmOpen(false)}
                className='h-9 px-3 rounded text-sm font-medium text-fg-2 hover:bg-tint cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountPhrase !== 'DELETE'}
                className='h-9 px-3 rounded bg-[#C9372C] hover:bg-[#AE2E24] text-white text-sm font-medium transition-colors cursor-pointer disabled:bg-line disabled:text-fg-4 disabled:cursor-not-allowed'
              >
                Confirm request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
