import {
  LogOut,
  Moon,
  PanelRight,
  Plus,
  RefreshCw,
  Search,
  Sun,
  X,
} from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';
import { useTheme } from '../../hooks/useTheme';

type Props = { app: AppController };

export default function AppHeader({ app }: Props) {
  const {
    searchQuery,
    setSearchQuery,
    setSortOrder,
    sortOrder,
    isLargeScreen,
    setIsSidebarOpen,
    fetchTasks,
    fetchDailyTasks,
    loading,
    openCreateModal,
    isDemoMode,
    handleLogout,
  } = app;
  const { isDark, toggleTheme } = useTheme();
  return (
    <header className='shrink-0 h-14 bg-surface border-b border-line flex items-center gap-2 sm:gap-4 px-4 z-20'>
      <div className='flex items-center gap-2.5 shrink-0 md:w-60'>
        <img
          src='/WoodWorksLogo.png'
          alt='WoodWorks Logo'
          className='w-10 h-10 rounded-2xl object-contain shadow-sm'
        />
        <span className='hidden sm:inline font-semibold text-[15px]'>
          WoodWorks
        </span>
      </div>

      <div
        className='relative flex-1 min-w-0 max-w-md'
        data-guide='header-search'
      >
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3' />
        <input
          type='text'
          aria-label='Search tasks'
          placeholder='Search tasks'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full h-9 bg-surface border-2 border-line hover:bg-subtle rounded pl-9 pr-9 text-sm placeholder-fg-3 focus:outline-none focus:border-fg focus:bg-surface'
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label='Clear search'
            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-fg-3 hover:bg-tint cursor-pointer'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        )}
      </div>

      <button
        onClick={() =>
          setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
        }
        data-guide='header-sort'
        title='Toggle creation date sort'
        className='h-9 px-3 flex items-center rounded border border-line bg-surface text-xs font-medium text-fg-2 hover:bg-tint transition-colors cursor-pointer shrink-0'
      >
        <span className='hidden sm:inline'>Sort:&nbsp;</span>
        {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        <span className='hidden sm:inline'>&nbsp;First</span>
      </button>

      <div className='ml-auto flex items-center gap-1 sm:gap-2 shrink-0'>
        {!isLargeScreen && (
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title='Toggle Utility Sidebar'
            aria-label='Toggle utility sidebar'
            className='h-9 w-9 flex items-center justify-center rounded text-warn hover:bg-warn-bg transition-colors cursor-pointer'
          >
            <PanelRight className='w-4 h-4' />
          </button>
        )}
        <button
          onClick={() => {
            fetchTasks(false);
            fetchDailyTasks();
          }}
          data-guide='header-refresh'
          title='Refresh tasks'
          aria-label='Refresh tasks'
          className='h-9 w-9 flex items-center justify-center rounded text-fg-2 hover:bg-tint transition-colors cursor-pointer'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className='h-9 w-9 flex items-center justify-center rounded text-fg-2 hover:bg-tint transition-colors cursor-pointer'
        >
          {isDark ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
        </button>
        <button
          onClick={openCreateModal}
          data-guide='header-create'
          aria-label='Create task'
          className='h-9 flex items-center gap-1.5 px-3 rounded bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors cursor-pointer'
        >
          <Plus className='w-4 h-4' />
          <span className='hidden sm:inline'>Create</span>
        </button>
        {!isDemoMode && (
          <button
            onClick={handleLogout}
            data-guide='header-logout'
            title='Sign out'
            aria-label='Sign out'
            className='h-9 px-2.5 sm:px-3 flex items-center gap-1.5 text-xs font-medium text-fg-2 hover:bg-tint rounded transition-colors cursor-pointer'
          >
            <LogOut className='w-4 h-4' />
            <span className='hidden sm:inline'>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
