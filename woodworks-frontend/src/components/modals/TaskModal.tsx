import { X, Pin, Flag } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function TaskModal({ app }: Props) {
  const { isModalOpen, closeModal, currentTask, setCurrentTask, groups, handleSaveTask, isSaving, isEditing, getTaskKey } = app;
  return (
<>
{isModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]"
    onClick={closeModal}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit task' : 'Create task'}
      className="bg-white rounded-md w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div>
          {isEditing && <p className="text-xs text-[#5C636A] mb-0.5">{getTaskKey(currentTask)}</p>}
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit task' : 'Create task'}</h2>
        </div>
        <button
          onClick={closeModal}
          aria-label="Close"
          className="p-1.5 rounded text-[#495057] hover:bg-[#2125290F] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSaveTask} className="px-6 pb-5 space-y-4">
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-[#495057] mb-1">
            Summary <span className="text-[#C9372C]">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            autoFocus
            maxLength={100}
            placeholder="What needs to be done?"
            value={currentTask.title}
            onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
            className="w-full h-10 bg-[#F8F9FA] border-2 border-[#DEE2E6] hover:bg-[#E9ECEF] rounded px-3 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-[#868E96]">{currentTask.title.length}/100</span> {/* <-- Add live counter */}
          </div>
        </div>

        <div>
          <label htmlFor="task-group" className="block text-xs font-semibold text-[#495057] mb-1">
            Group
          </label>
          <select
            id="task-group"
            value={currentTask.groupId ?? ''}
            onChange={(e) => setCurrentTask({ ...currentTask, groupId: e.target.value || null })}
            className="w-full h-10 bg-[#F8F9FA] border-2 border-[#DEE2E6] hover:bg-[#E9ECEF] rounded px-3 text-sm focus:outline-none focus:border-[#212529] focus:bg-white"
          >
            <option value="">No group</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <p className="text-[11px] text-[#868E96] mt-1">Group membership is stored locally until backend support is added.</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-[#495057] mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={1000}
            placeholder="Add details about this task"
            value={currentTask.description || ''}
            onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
            className="w-full bg-[#F8F9FA] border-2 border-[#DEE2E6] hover:bg-[#E9ECEF] rounded px-3 py-2 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-[#868E96]">{(currentTask.description || '').length}/1000</span> {/* <-- Add live counter */}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              checked={currentTask.completed}
              onChange={(e) => setCurrentTask({ ...currentTask, completed: e.target.checked })}
              className="w-4 h-4 rounded-sm accent-[#212529] cursor-pointer"
            />
            <label htmlFor="completed" className="text-sm cursor-pointer">
              Mark as completed
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              checked={currentTask.pinned || false}
              onChange={(e) => setCurrentTask({ ...currentTask, pinned: e.target.checked })}
              className="w-4 h-4 rounded-sm accent-[#D97706] cursor-pointer"
            />
            <label htmlFor="pinned" className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Pin className="w-3.5 h-3.5 text-[#D97706]" />
              Pin task to the top
              <span className="text-xs text-[#5C636A]">(shown above all tasks)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="urgent"
              checked={currentTask.urgent || false}
              onChange={(e) => setCurrentTask({ ...currentTask, urgent: e.target.checked })}
              className="w-4 h-4 rounded-sm accent-[#BF5700] cursor-pointer"
            />
            <label htmlFor="urgent" className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Flag className="w-3.5 h-3.5 text-[#BF5700]" />
              Mark as urgent
              <span className="text-xs text-[#5C636A]">(shown below pinned tasks)</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={closeModal}
            className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !currentTask.title.trim()}
            className="h-9 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium transition-colors cursor-pointer disabled:bg-[#2125290F] disabled:text-[#868E96] disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
</>
  );
}
