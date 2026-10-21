import { SquareCheckBig, FolderPlus, Folder, Settings } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function Sidebar({ app }: Props) {
  const { navItems, selectedGroupId, filter, setFilter, setSelectedGroupId, setMobilePanel, setGroupNameInput, setIsGroupModalOpen, groups, tasks, completedCount, setIsAccountManagerOpen } = app;
  return (
  <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#212529] border-r border-white/10 p-3 overflow-hidden">
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

    <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-0.5">
      {groups.length === 0 ? (
        <p className="px-2.5 py-2 text-xs leading-5 text-white/45">Create a group to organize related tasks.</p>
      ) : groups.map((group) => {
        const active = selectedGroupId === group.id;
        const count = tasks.filter((task) => task.groupId === group.id).length;
        return (
          <button
            key={group.id}
            onClick={() => { setSelectedGroupId(group.id); setFilter('ALL'); setMobilePanel('tasks'); }}
            aria-current={active ? 'page' : undefined}
            title={group.name}
            className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded text-sm transition-colors cursor-pointer ${
              active
                ? 'bg-[#495057] text-white font-semibold'
                : 'text-white/70 hover:bg-[#495057] hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 text-left truncate">{group.name}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 text-white ${active ? 'bg-white/20' : 'bg-white/10'}`}>
              {count}
            </span>
          </button>
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
        <span>Account manager</span>
      </button>
    </div>
  </aside>
  );
}
