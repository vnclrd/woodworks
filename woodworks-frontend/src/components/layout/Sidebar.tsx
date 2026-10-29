import {
  AlertTriangle,
  Folder,
  FolderPlus,
  HelpCircle,
  LogOut,
  Settings,
  SquareCheckBig,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppController } from '../../hooks/useAppController';
import AvatarPickerModal from '../modals/AvatarPickerModal';
import UserAvatar from '../ui/UserAvatar';

type Props = { app: AppController; onStartGuide?: () => void };

export default function Sidebar({ app, onStartGuide }: Props) {
  const {
    navItems,
    selectedGroupId,
    filter,
    setFilter,
    setSelectedGroupId,
    setMobilePanel,
    setGroupNameInput,
    setIsGroupModalOpen,
    groups,
    tasks,
    completedCount,
    setIsAccountManagerOpen,
    handleDeleteGroup,
    groupToDelete,
    setGroupToDelete,
    userEmail,
    avatarId,
    changeAvatar,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isDemoMode,
    handleLogout,
  } = app;

  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // Phones: Escape closes the navigation drawer
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileNavOpen, setIsMobileNavOpen]);

  return (
    <>
    {/* Phones: dimmed backdrop behind the drawer */}
    <div
      aria-hidden='true'
      onClick={() => setIsMobileNavOpen(false)}
      className={`md:hidden fixed inset-0 z-40 bg-[#2125298A] transition-opacity duration-200 motion-reduce:transition-none ${
        isMobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    />

    {/* Phones: slide-in drawer. Tablets/desktop: the normal fixed sidebar */}
    <aside
      id='mobile-nav'
      aria-label='Task navigation'
      className={`flex flex-col shrink-0 bg-sidebar border-r border-white/10 p-3 overflow-hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-[translate,visibility] duration-200 motion-reduce:transition-none md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:transition-none ${
        isMobileNavOpen ? 'translate-x-0' : '-translate-x-full max-md:invisible'
      }`}
    >
      <div className='shrink-0 flex items-center gap-3 px-2 py-3 mb-2'>
        <div className='w-9 h-9 rounded bg-white/10 text-white flex items-center justify-center'>
          <SquareCheckBig className='w-5 h-5' />
        </div>
        <div className='min-w-0'>
          <p className='text-sm font-semibold text-white truncate'>
            WoodWorks Tasks
          </p>
          <p className='text-xs text-white/60'>Task management</p>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(false)}
          aria-label='Close menu'
          className='md:hidden ml-auto h-10 w-10 -mr-2 flex items-center justify-center rounded text-white/75 hover:bg-white/10 hover:text-white cursor-pointer'
        >
          <X className='w-5 h-5' />
        </button>
      </div>

      <nav
        className='shrink-0 space-y-0.5'
        aria-label='Task filters'
        data-guide='sidebar-filters'
      >
        {navItems.map(({ key, label, icon: Icon, count }) => {
          const active = !selectedGroupId && filter === key;
          return (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setSelectedGroupId(null);
                setMobilePanel('tasks');
                setIsMobileNavOpen(false);
              }}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 h-11 md:h-9 rounded text-sm transition-colors cursor-pointer ${
                active
                  ? 'bg-primary-hover text-white font-semibold'
                  : 'text-white/70 hover:bg-primary-hover hover:text-white'
              }`}
            >
              <Icon className='w-4 h-4' />
              <span className='flex-1 text-left'>{label}</span>
              <span
                className={`text-xs rounded-full px-2 py-0.5 text-white ${
                  active ? 'bg-white/20' : 'bg-white/10'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className='shrink-0 mt-3 border-t border-white/15 pt-3'>
        <div
          className='flex items-center justify-between px-2.5 mb-2'
          data-guide='sidebar-groups'
        >
          <p className='text-xs font-semibold text-white/60'>Groups</p>
          <button
            onClick={() => {
              setGroupNameInput('');
              setIsGroupModalOpen(true);
            }}
            title='Create group'
            aria-label='Create group'
            className='w-9 h-9 md:w-7 md:h-7 -mr-1 md:mr-0 flex items-center justify-center rounded text-white/75 hover:bg-white/10 hover:text-white transition-colors cursor-pointer'
          >
            <FolderPlus className='w-4 h-4' />
          </button>
        </div>
      </div>

      <div className='scrollbar-on-dark flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-0.5'>
        {groups.length === 0 ? (
          <p className='px-2.5 py-2 text-xs leading-5 text-white/45'>
            Create a group to organize related tasks.
          </p>
        ) : (
          groups.map((group) => {
            const active = selectedGroupId === group.id;
            const count = tasks.filter(
              (task) =>
                String(task.groupId) === String(group.id) ||
                task.groupName === group.name,
            ).length;
            return (
              <div
                key={group.id}
                className={`flex items-center gap-1 w-full h-11 md:h-9 rounded px-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary-hover text-white font-semibold'
                    : 'text-white/70 hover:bg-primary-hover hover:text-white'
                }`}
              >
                <button
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setFilter('ALL');
                    setMobilePanel('tasks');
                    setIsMobileNavOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  title={group.name}
                  className='flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer'
                >
                  <Folder className='w-4 h-4 shrink-0' />
                  <span className='flex-1 min-w-0 truncate'>{group.name}</span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 text-white ${active ? 'bg-white/20' : 'bg-white/10'}`}
                  >
                    {count}
                  </span>
                </button>

                {/* Always visible trash button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupToDelete(group);
                  }}
                  className='p-2 md:p-1 text-white/40 hover:text-red-400 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0'
                  title='Delete group'
                  aria-label={`Delete group ${group.name}`}
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className='shrink-0 mt-4 px-2.5 pb-3' data-guide='sidebar-progress'>
        <p className='text-xs font-semibold text-white/60 mb-2'>Progress</p>
        <div className='h-2 rounded-full bg-white/15 overflow-hidden'>
          <div
            className='h-full bg-[#4BCE97] transition-[width] duration-300'
            style={{
              width: tasks.length
                ? `${(completedCount / tasks.length) * 100}%`
                : '0%',
            }}
          />
        </div>
        <p className='text-xs text-white/60 mt-1.5'>
          {completedCount} of {tasks.length} done
        </p>
      </div>

      <div className='shrink-0 border-t border-white/15 pt-3'>
        {userEmail && (
          <div
            className='flex items-center gap-2.5 px-2.5 pb-3'
            title={userEmail}
          >
            <button
              onClick={() => setIsAvatarPickerOpen(true)}
              title='Change profile picture'
              aria-label='Change profile picture'
              className='shrink-0 rounded-full cursor-pointer hover:ring-2 hover:ring-white/40 transition'
            >
              <UserAvatar email={userEmail} avatarId={avatarId} size={28} />
            </button>
            <div className='min-w-0'>
              <p className='text-[11px] leading-none text-white/45 mb-1'>
                Signed in as
              </p>
              <p className='text-xs text-white/80 truncate'>{userEmail}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setIsMobileNavOpen(false);
            setIsAccountManagerOpen(true);
          }}
          data-guide='sidebar-account'
          className='w-full h-11 md:h-10 flex items-center gap-2.5 px-2.5 rounded text-sm text-white/75 hover:bg-primary-hover hover:text-white transition-colors cursor-pointer'
        >
          <Settings className='w-4 h-4' />
          <span>Account Manager</span>
        </button>

        {onStartGuide && (
          <button
            onClick={() => {
              setIsMobileNavOpen(false);
              onStartGuide?.();
            }}
            className='w-full h-11 md:h-10 flex items-center gap-2.5 px-2.5 rounded text-sm text-white/75 hover:bg-primary-hover hover:text-white transition-colors cursor-pointer'
          >
            <HelpCircle className='w-4 h-4' />
            <span>App Guide</span>
          </button>
        )}

        {/* Phones: Logout lives here instead of the cramped header */}
        {!isDemoMode && (
          <button
            onClick={() => {
              setIsMobileNavOpen(false);
              handleLogout();
            }}
            className='md:hidden w-full h-11 flex items-center gap-2.5 px-2.5 rounded text-sm text-white/75 hover:bg-primary-hover hover:text-white transition-colors cursor-pointer'
          >
            <LogOut className='w-4 h-4' />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>

    {/* Modals sit outside the aside so the drawer's slide animation can't trap them */}

      {isAvatarPickerOpen && (
        <AvatarPickerModal
          email={userEmail}
          currentId={avatarId}
          onSave={(id) => {
            changeAvatar(id);
            setIsAvatarPickerOpen(false);
          }}
          onClose={() => setIsAvatarPickerOpen(false)}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {groupToDelete && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2125298A]'
          onClick={() => setGroupToDelete(null)}
        >
          <div
            className='bg-surface rounded-md w-full max-w-sm shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F] p-6 text-fg'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-3'>
              <div className='w-9 h-9 rounded-full bg-danger-bg text-danger flex items-center justify-center'>
                <AlertTriangle className='w-5 h-5' />
              </div>
              <button
                onClick={() => setGroupToDelete(null)}
                className='p-1.5 rounded text-fg-2 hover:bg-tint cursor-pointer'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            <h3 className='text-lg font-semibold mb-1'>
              Delete group &ldquo;{groupToDelete.name}&rdquo;?
            </h3>
            <p className='text-xs text-fg-3 leading-relaxed mb-5'>
              Tasks inside this group will be moved to{' '}
              <strong className='text-fg'>&quot;No group&quot;</strong> and will
              not be deleted.
            </p>

            <div className='flex items-center justify-end gap-2'>
              <button
                type='button'
                onClick={() => setGroupToDelete(null)}
                className='h-9 px-3 rounded text-sm font-medium text-fg-2 hover:bg-tint cursor-pointer'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={() => {
                  handleDeleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }}
                className='h-9 px-3 rounded bg-[#C9372C] hover:bg-[#A62C22] text-white text-sm font-medium transition-colors cursor-pointer'
              >
                Delete group
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}