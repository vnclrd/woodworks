import { Search, X, PanelRight, RefreshCw, Plus, LogOut } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function AppHeader({ app }: Props) {
  const { searchQuery, setSearchQuery, setSortOrder, sortOrder, isLargeScreen, setIsSidebarOpen, fetchTasks, fetchDailyTasks, loading, openCreateModal, isDemoMode, handleLogout } = app;
  return (
<header className="shrink-0 h-14 bg-white border-b border-[#DEE2E6] flex items-center gap-2 sm:gap-4 px-4 z-20">
  <div className="flex items-center gap-2.5 shrink-0 md:w-60">
    <img 
      src="/WoodWorksLogo.png"
      alt="WoodWorks Logo" 
      className="w-10 h-10 rounded-2xl object-contain shadow-sm"
    />
    <span className="hidden sm:inline font-semibold text-[15px]">WoodWorks</span>
  </div>

  <div className="relative flex-1 min-w-0 max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C636A]" />
    <input
      type="text"
      aria-label="Search tasks"
      placeholder="Search tasks"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full h-9 bg-white border-2 border-[#DEE2E6] hover:bg-[#F8F9FA] rounded pl-9 pr-9 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        aria-label="Clear search"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#5C636A] hover:bg-[#2125290F] cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>

  <button
    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
    title="Toggle creation date sort"
    className="h-9 px-3 flex items-center rounded border border-[#DEE2E6] bg-white text-xs font-medium text-[#495057] hover:bg-[#2125290F] transition-colors cursor-pointer shrink-0"
  >
    <span className="hidden sm:inline">Sort:&nbsp;</span>
    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
    <span className="hidden sm:inline">&nbsp;First</span>
  </button>

  <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
    {!isLargeScreen && (
      <button
        onClick={() => setIsSidebarOpen(prev => !prev)}
        title="Toggle Utility Sidebar"
        aria-label="Toggle utility sidebar"
        className="h-9 w-9 flex items-center justify-center rounded text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
      >
        <PanelRight className="w-4 h-4" />
      </button>
    )}
    <button
      onClick={() => { fetchTasks(false); fetchDailyTasks(); }}
      title="Refresh tasks"
      aria-label="Refresh tasks"
      className="h-9 w-9 flex items-center justify-center rounded text-[#495057] hover:bg-[#2125290F] transition-colors cursor-pointer"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </button>
    <button
      onClick={openCreateModal}
      aria-label="Create task"
      className="h-9 flex items-center gap-1.5 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium transition-colors cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Create</span>
    </button>
    {!isDemoMode && (
      <button
        onClick={handleLogout}
        title="Sign out"
        aria-label="Sign out"
        className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 text-xs font-medium text-[#495057] hover:bg-[#2125290F] rounded transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    )}
  </div>
</header>
  );
}