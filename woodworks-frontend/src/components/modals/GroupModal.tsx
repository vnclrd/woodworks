import { X } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function GroupModal({ app }: Props) {
  const { isGroupModalOpen, setIsGroupModalOpen, handleCreateGroup, groupNameInput, setGroupNameInput } = app;
  return (
<>
{isGroupModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]"
    onClick={() => setIsGroupModalOpen(false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
      className="bg-white rounded-md w-full max-w-md shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div>
          <p className="text-xs text-[#5C636A] mb-0.5">Organize your work</p>
          <h2 id="create-group-title" className="text-xl font-semibold">Create a group</h2>
        </div>
        <button
          onClick={() => setIsGroupModalOpen(false)}
          aria-label="Close"
          className="p-1.5 rounded text-[#495057] hover:bg-[#2125290F] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleCreateGroup} className="px-6 pb-5 space-y-4">
        <div>
          <label htmlFor="group-name" className="block text-xs font-semibold text-[#495057] mb-1">
            Group name <span className="text-[#C9372C]">*</span>
          </label>
          <input
            id="group-name"
            autoFocus
            required
            maxLength={40}
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            placeholder="e.g. Personal, Work, Side projects"
            className="w-full h-10 bg-[#F8F9FA] border-2 border-[#DEE2E6] hover:bg-[#E9ECEF] rounded px-3 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white"
          />
          <p className="text-xs text-[#868E96] mt-1.5">Groups are saved securely to your cloud database.</p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsGroupModalOpen(false)}
            className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
          >Cancel</button>
          <button
            type="submit"
            disabled={!groupNameInput.trim()}
            className="h-9 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium transition-colors cursor-pointer disabled:bg-[#2125290F] disabled:text-[#868E96] disabled:cursor-not-allowed"
          >Create group</button>
        </div>
      </form>
    </div>
  </div>
)}
</>
  );
}
