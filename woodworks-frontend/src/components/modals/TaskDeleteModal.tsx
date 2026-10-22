import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function TaskDeleteModal({ app }: Props) {
  const { taskToDelete, setTaskToDelete, getTaskKey, confirmDelete } = app;
  return (
<>
{taskToDelete && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]"
    onClick={() => setTaskToDelete(null)}
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Delete task"
      className="bg-white rounded-md w-full max-w-sm p-6 shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-lg font-semibold">Delete {getTaskKey(taskToDelete)}?</h2>
      <p className="text-sm text-[#495057] mt-2 wrap-break-words">
        "{taskToDelete.title}" will be permanently deleted. This can't be undone.
      </p>
      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          onClick={() => setTaskToDelete(null)}
          autoFocus
          className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={confirmDelete}
          className="h-9 px-3 rounded bg-[#C9372C] hover:bg-[#AE2E24] text-white text-sm font-medium transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
</>
  );
}
