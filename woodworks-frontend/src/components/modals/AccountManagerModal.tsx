import { KeyRound, Settings, ShieldAlert, X } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function AccountManagerModal({ app }: Props) {
  const {
    isAccountManagerOpen,
    setIsAccountManagerOpen,
    currentPasswordInput,
    setCurrentPasswordInput,
    newAccountPasswordInput,
    setNewAccountPasswordInput,
    showAccountPasswords,
    setShowAccountPasswords,
    confirmAccountPasswordInput,
    setConfirmAccountPasswordInput,
    handleChangePassword,
    setIsDeleteAccountConfirmOpen,
    setDeleteAccountPhrase,
  } = app;
  return (
    <>
      {isAccountManagerOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]'
          onClick={() => setIsAccountManagerOpen(false)}
        >
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='account-manager-title'
            className='bg-surface rounded-md w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 pt-5 pb-4 border-b border-line'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded bg-chip flex items-center justify-center'>
                  <Settings className='w-5 h-5 text-fg-2' />
                </div>
                <div>
                  <h2
                    id='account-manager-title'
                    className='text-xl font-semibold'
                  >
                    Account manager
                  </h2>
                  <p className='text-xs text-fg-3 mt-0.5'>
                    Password and account controls
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountManagerOpen(false)}
                aria-label='Close account manager'
                className='p-1.5 rounded text-fg-2 hover:bg-tint cursor-pointer'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <div className='px-6 py-5 space-y-6'>
              <section>
                <div className='flex items-center gap-2 mb-1'>
                  <KeyRound className='w-4 h-4 text-fg-2' />
                  <h3 className='text-sm font-semibold'>Change password</h3>
                </div>
                <p className='text-xs leading-5 text-fg-3 mb-4'>
                  Verify your current password, then choose a new one (at least
                  8 characters).
                </p>
                <form onSubmit={handleChangePassword} className='space-y-3'>
                  <div>
                    <label
                      htmlFor='current-account-password'
                      className='block text-xs font-semibold text-fg-2 mb-1'
                    >
                      Current password
                    </label>
                    <input
                      id='current-account-password'
                      type={showAccountPasswords ? 'text' : 'password'}
                      autoComplete='current-password'
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      className='w-full h-10 bg-surface border-2 border-line rounded px-3 text-sm focus:outline-none focus:border-fg'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='new-account-password'
                      className='block text-xs font-semibold text-fg-2 mb-1'
                    >
                      New password
                    </label>
                    <input
                      id='new-account-password'
                      type={showAccountPasswords ? 'text' : 'password'}
                      autoComplete='new-password'
                      minLength={8}
                      required
                      value={newAccountPasswordInput}
                      onChange={(e) =>
                        setNewAccountPasswordInput(e.target.value)
                      }
                      className='w-full h-10 bg-surface border-2 border-line rounded px-3 text-sm focus:outline-none focus:border-fg'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='confirm-account-password'
                      className='block text-xs font-semibold text-fg-2 mb-1'
                    >
                      Confirm new password
                    </label>
                    <input
                      id='confirm-account-password'
                      type={showAccountPasswords ? 'text' : 'password'}
                      autoComplete='new-password'
                      minLength={8}
                      required
                      value={confirmAccountPasswordInput}
                      onChange={(e) =>
                        setConfirmAccountPasswordInput(e.target.value)
                      }
                      className='w-full h-10 bg-surface border-2 border-line rounded px-3 text-sm focus:outline-none focus:border-fg'
                    />
                  </div>
                  <label className='inline-flex items-center gap-2 text-xs text-fg-2 cursor-pointer select-none'>
                    <input
                      type='checkbox'
                      checked={showAccountPasswords}
                      onChange={(e) =>
                        setShowAccountPasswords(e.target.checked)
                      }
                      className='w-4 h-4 accent-fg'
                    />
                    Show passwords
                  </label>
                  <div className='pt-1 flex justify-end'>
                    <button
                      type='submit'
                      className='h-9 px-3 rounded bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors cursor-pointer'
                    >
                      Update password
                    </button>
                  </div>
                </form>
              </section>

              <section className='border-t border-line pt-5'>
                <div className='flex items-center gap-2 mb-1'>
                  <ShieldAlert className='w-4 h-4 text-danger' />
                  <h3 className='text-sm font-semibold'>Delete account</h3>
                </div>
                <p className='text-xs leading-5 text-fg-3'>
                  Permanently remove your account and all associated tasks from
                  the database.
                </p>
                <div className='mt-4 flex justify-end'>
                  <button
                    onClick={() => {
                      setDeleteAccountPhrase('');
                      setIsDeleteAccountConfirmOpen(true);
                    }}
                    className='h-9 px-3 rounded border border-danger-line bg-surface hover:bg-danger-bg text-danger text-sm font-semibold transition-colors cursor-pointer'
                  >
                    Delete account
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
