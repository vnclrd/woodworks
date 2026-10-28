import { X } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function GroupModal({ app }: Props) {
  const {
    isGroupModalOpen,
    setIsGroupModalOpen,
    handleCreateGroup,
    groupNameInput,
    setGroupNameInput,
  } = app;
  return (
    <>
      {isGroupModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]'
          onClick={() => setIsGroupModalOpen(false)}
        >
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='create-group-title'
            className='bg-surface rounded-md w-full max-w-md shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between px-6 pt-5 pb-2'>
              <div>
                <p className='text-xs text-fg-3 mb-0.5'>Organize your work</p>
                <h2 id='create-group-title' className='text-xl font-semibold'>
                  Create a group
                </h2>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                aria-label='Close'
                className='p-1.5 rounded text-fg-2 hover:bg-tint cursor-pointer'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className='px-6 pb-5 space-y-4'>
              <div>
                <label
                  htmlFor='group-name'
                  className='block text-xs font-semibold text-fg-2 mb-1'
                >
                  Group name <span className='text-danger'>*</span>
                </label>
                <input
                  id='group-name'
                  autoFocus
                  required
                  maxLength={50} // <-- Update to match backend limit (50 characters)
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder='e.g. Personal, Work, Side projects'
                  className='w-full h-10 bg-subtle border-2 border-line hover:bg-chip rounded px-3 text-sm placeholder-fg-3 focus:outline-none focus:border-fg focus:bg-surface'
                />
                <div className='flex items-center justify-between mt-1.5'>
                  <p className='text-xs text-fg-4'>
                    Groups are saved securely to your cloud database.
                  </p>
                  <p className='text-xs text-fg-4'>
                    {groupNameInput.length}/50
                  </p>{' '}
                  {/* <-- Optional live character counter */}
                </div>
              </div>
              <div className='flex items-center justify-end gap-2 pt-1'>
                <button
                  type='button'
                  onClick={() => setIsGroupModalOpen(false)}
                  className='h-9 px-3 rounded text-sm font-medium text-fg-2 hover:bg-tint cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={!groupNameInput.trim()}
                  className='h-9 px-3 rounded bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors cursor-pointer disabled:bg-tint disabled:text-fg-4 disabled:cursor-not-allowed'
                >
                  Create group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
