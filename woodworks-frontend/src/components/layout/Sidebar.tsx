import { SquareCheckBig, FolderPlus, Folder, Settings, Trash2, AlertTriangle, X } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function Sidebar({ app }: Props) {
  const { 
    navItems, selectedGroupId, filter, setFilter, setSelectedGroupId, 
    setMobilePanel, setGroupNameInput, setIsGroupModalOpen, groups, tasks, 
    completedCount, setIsAccountManagerOpen, handleDeleteGroup,
    groupToDelete, setGroupToDelete 
  } = app;

  return (
  <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#212529] border-r border-white/10 p-3 overflow-hidden relative">
    <div className="shrink-0 flex items-center gap-3 px-2 py-3 mb-2">
      <div className="w-9 h-9 rounded bg-white/10 text-white flex items-center justify-center">
        <SquareCheckBig className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">WoodWorks Tasks</p>
        <p className="text-xs text-white/60">Task management</p>
      </div>
    </div>

    <nav className="shrink-0 space-y-0.5" aria-label="Task filters">
      {navItems.map(({ key, label, icon: Icon, count }) => {
        const active = !selectedGroupId && filter === key;
        return (
          <button
            key={key}
            onClick={() => { setFilter(key); setSelectedGroupId(null); setMobilePanel('tasks'); }}
            aria-current={active ? 'page' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded text-sm transition-colors cursor-pointer ${
              active
                ? 'bg-[#495057] text-white font-semibold'
                : 'text-white/70 hover:bg-[#495057] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="flex-1 text-left">{label}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 text-white ${
              active ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </nav>

    <div className="shrink-0 mt-3 border-t border-white/15 pt-3">
      <div className="flex items-center justify-between px-2.5 mb-2">
        <p className="text-xs font-semibold text-white/60">Groups</p>
        <button
          onClick={() => { setGroupNameInput(''); setIsGroupModalOpen(true); }}
          title="Create group"
          aria-label="Create group"
          className="w-7 h-7 flex items-center justify-center rounded text-white/75 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="scrollbar-on-dark flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-0.5">
      {groups.length === 0 ? (
        <p className="px-2.5 py-2 text-xs leading-5 text-white/45">Create a group to organize related tasks.</p>
      ) : groups.map((group) => {
        const active = selectedGroupId === group.id;
        const count = tasks.filter((task) => String(task.groupId) === String(group.id) || task.groupName === group.name).length;
        return (
          <div
            key={group.id}
            className={`flex items-center gap-1 w-full h-9 rounded px-2 text-sm transition-colors ${
              active
                ? 'bg-[#495057] text-white font-semibold'
                : 'text-white/70 hover:bg-[#495057] hover:text-white'
            }`}
          >
            <button
              onClick={() => { setSelectedGroupId(group.id); setFilter('ALL'); setMobilePanel('tasks'); }}
              aria-current={active ? 'page' : undefined}
              title={group.name}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="flex-1 min-w-0 truncate">{group.name}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 text-white ${active ? 'bg-white/20' : 'bg-white/10'}`}>
                {count}
              </span>
            </button>

            {/* Always visible trash button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGroupToDelete(group);
              }}
              className="p-1 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0"
              title="Delete group"
              aria-label={`Delete group ${group.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>

    <div className="shrink-0 mt-4 px-2.5 pb-3">
      <p className="text-xs font-semibold text-white/60 mb-2">Progress</p>
      <div className="h-2 rounded-full bg-white/15 overflow-hidden">
        <div
          className="h-full bg-[#4BCE97] transition-[width] duration-300"
          style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
        />
      </div>
      <p className="text-xs text-white/60 mt-1.5">{completedCount} of {tasks.length} done</p>
    </div>

    <div className="shrink-0 border-t border-white/15 pt-3">
      <button
        onClick={() => setIsAccountManagerOpen(true)}
        className="w-full h-10 flex items-center gap-2.5 px-2.5 rounded text-sm text-white/75 hover:bg-[#495057] hover:text-white transition-colors cursor-pointer"
      >
        <Settings className="w-4 h-4" />
        <span>Account Manager</span>
      </button>
    </div>

    {/* Custom Delete Confirmation Modal */}
    {groupToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]" onClick={() => setGroupToDelete(null)}>
        <div 
          className="bg-white rounded-md w-full max-w-sm shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F] p-6 text-[#212529]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-full bg-red-100 text-[#C9372C] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button 
              onClick={() => setGroupToDelete(null)}
              className="p-1.5 rounded text-[#495057] hover:bg-[#2125290F] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-semibold mb-1">Delete group &ldquo;{groupToDelete.name}&rdquo;?</h3>
          <p className="text-xs text-[#5C636A] leading-relaxed mb-5">
            Tasks inside this group will be moved to <strong className="text-[#212529]">&quot;No group&quot;</strong> and will not be deleted.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setGroupToDelete(null)}
              className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleDeleteGroup(groupToDelete.id);
                setGroupToDelete(null);
              }}
              className="h-9 px-3 rounded bg-[#C9372C] hover:bg-[#A62C22] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Delete group
            </button>
          </div>
        </div>
      </div>
    )}
  </aside>
  );
}