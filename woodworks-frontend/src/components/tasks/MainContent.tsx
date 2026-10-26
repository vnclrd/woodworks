import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Pin,
  Flag,
  Pencil,
  Trash2,
  Plus,
  Repeat,
  Mic,
  MicOff,
} from 'lucide-react';
import { useState } from 'react';
import type { AppController } from '../../hooks/useAppController';

const QUICK_TITLE_MAX = 100;

type Props = { app: AppController };

export default function MainContent({ app }: Props) {
  const {
    isBackendOnline,
    fetchTasks,
    filterTitle,
    isFirstLoad,
    filteredTasks,
    searchQuery,
    filter,
    setFilter,
    setSelectedGroupId,
    setMobilePanel,
    mobilePanel,
    cardsSideBySide,
    dailyDoneCount,
    dailyTasks,
    today,
    tasks,
    toggleComplete,
    getTaskKey,
    openEditModal,
    togglePinned,
    toggleUrgent,
    setTaskToDelete,
    handleQuickAdd,
    quickTitle,
    setQuickTitle,
    allDailyDone,
    todayLabel,
    toggleDaily,
    deleteDaily,
    handleAddDaily,
    dailyTitle,
    setDailyTitle,
  } = app;

  const [isListening, setIsListening] = useState(false);

  // Character-limit warning states
  const quickTitleAtLimit = quickTitle.length >= QUICK_TITLE_MAX;
  const quickTitleNearLimit =
    quickTitle.length >= QUICK_TITLE_MAX - 10 && !quickTitleAtLimit;

  return (
    <main className="flex-1 min-w-0 min-h-0 flex flex-col px-4 sm:px-6 py-6">
      {!isBackendOnline && (
        <div
          className="shrink-0 mb-5 flex items-start gap-3 rounded border border-[#F5CD47] bg-[#FFF7D6] px-4 py-3 text-sm"
          role="status"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 text-[#946F00] shrink-0" />

          <p className="flex-1">
            <span className="font-semibold">
              Backend waking up / offline.
            </span>{' '}
            Displaying cached tasks. Changes sync automatically once online.
          </p>

          <button
            onClick={() => fetchTasks(false)}
            className="shrink-0 h-7 px-2.5 rounded text-xs font-semibold text-[#212529] hover:bg-[#21252914] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="shrink-0 flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-[#5C636A] mb-1">
            Tasks / {filterTitle}
          </p>

          <h1 className="text-2xl font-semibold">{filterTitle}</h1>

          {!isFirstLoad && (
            <p className="text-sm text-[#5C636A] mt-1">
              {filteredTasks.length}{' '}
              {filteredTasks.length === 1 ? 'task' : 'tasks'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          )}
        </div>

        <div className="md:hidden shrink-0 flex rounded border border-[#DEE2E6] bg-white overflow-hidden">
          {['ALL', 'PENDING', 'URGENT', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                setSelectedGroupId(null);
                setMobilePanel('tasks');
              }}
              className={`px-2.5 h-8 text-xs font-medium cursor-pointer transition-colors ${
                filter === tab
                  ? 'bg-[#212529] text-white'
                  : 'text-[#495057] hover:bg-[#2125290F]'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`${
          cardsSideBySide ? 'hidden' : 'flex'
        } shrink-0 mb-3 w-fit rounded border border-[#DEE2E6] bg-white overflow-hidden`}
      >
        {(
          [
            { key: 'tasks', label: 'Tasks' },
            {
              key: 'daily',
              label: `Daily (${dailyDoneCount}/${dailyTasks.length})`,
            },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMobilePanel(key)}
            aria-pressed={mobilePanel === key}
            className={`px-3 h-8 text-xs font-medium cursor-pointer transition-colors ${
              mobilePanel === key
                ? 'bg-[#212529] text-white'
                : 'text-[#495057] hover:bg-[#2125290F]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main task card and daily task card */}
      <div
        className={`flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] gap-4 ${
          cardsSideBySide
            ? 'grid-cols-[minmax(0,3.2fr)_minmax(0,0.85fr)]'
            : 'grid-cols-1'
        }`}
      >
        {/* Main task card */}
        <div
          data-guide="tasks-card"
          className={`${
            cardsSideBySide || mobilePanel === 'tasks' ? 'flex' : 'hidden'
          } @container min-w-0 min-h-0 flex-col bg-white border border-[#DEE2E6] rounded-md overflow-hidden`}
        >
          <div className="shrink-0 hidden @xl:grid grid-cols-[2rem_5rem_1fr_11.5rem_8rem] gap-3 px-4 h-10 items-center border-b border-[#DEE2E6] bg-[#F8F9FA] text-xs font-semibold text-[#5C636A]">
            <span />
            <span>Key</span>
            <span>Summary</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="scrollbar-light flex-1 min-h-0 overflow-y-auto">
            {isFirstLoad ? (
              <ul
                className="divide-y divide-[#DEE2E6]"
                aria-busy="true"
                aria-label="Loading tasks"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <li
                    key={i}
                    className="px-4 py-4 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#DEE2E6]" />

                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/3 rounded bg-[#DEE2E6]" />
                      <div className="h-3 w-1/2 rounded bg-[#E9ECEF]" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : filteredTasks.length === 0 ? (
              <div className="py-14 text-center">
                <p className="font-semibold">
                  {tasks.length === 0
                    ? 'No tasks yet'
                    : 'No tasks match this view'}
                </p>

                <p className="text-sm text-[#5C636A] mt-1">
                  {tasks.length === 0
                    ? 'Add your first task below or use Create.'
                    : 'Clear the search or switch filters to see more.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#DEE2E6]">
                {filteredTasks.map((task) => {
                  const urgent = !task.completed && task.urgent;
                  const pinned = !task.completed && task.pinned;

                  return (
                    <li
                      key={task.id}
                      className={`grid grid-cols-[2rem_1fr_auto] @xl:grid-cols-[2rem_5rem_1fr_11.5rem_8rem] gap-3 px-4 py-3 items-center hover:bg-[#F8F9FA] transition-colors ${
                        pinned
                          ? 'bg-[#FFF9F0] shadow-[inset_3px_0_0_#D97706]'
                          : urgent
                            ? 'shadow-[inset_3px_0_0_#BF5700]'
                            : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleComplete(task)}
                        aria-label={
                          task.completed ? 'Mark as to do' : 'Mark as done'
                        }
                        className="text-[#5C636A] hover:text-[#1F845A] transition-colors cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1F845A]" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <span className="hidden @xl:block text-xs text-[#5C636A] font-medium">
                        {getTaskKey(task)}
                      </span>

                      <button
                        onClick={() => {
                          app.setActiveTaskId(task.id);
                          app.setIsSidebarOpen(true);
                        }}
                        title={task.title}
                        className="min-w-0 text-left cursor-pointer"
                      >
                        <p
                          className={`text-sm font-medium truncate hover:underline ${
                            task.completed
                              ? 'line-through text-[#5C636A]'
                              : ''
                          }`}
                        >
                          {pinned && (
                            <Pin className="inline w-3.5 h-3.5 mr-1 text-[#D97706]" />
                          )}

                          {urgent && (
                            <Flag className="inline w-3.5 h-3.5 mr-1 text-[#BF5700]" />
                          )}

                          {task.title}
                        </p>

                        {task.description && (
                          <p className="text-xs text-[#5C636A] mt-0.5 truncate">
                            {task.description}
                          </p>
                        )}
                      </button>

                      <div className="hidden @xl:flex flex-wrap items-center content-center gap-1 min-w-0">
                        {pinned && (
                          <span className="inline-flex items-center px-1.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#B45309] leading-none shrink-0">
                            Pinned
                          </span>
                        )}

                        {urgent && (
                          <span className="inline-flex items-center px-1.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFEAD6] text-[#A34A00] leading-none shrink-0">
                            Urgent
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center px-1.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider leading-none shrink-0 ${
                            task.completed
                              ? 'bg-[#DCFFF1] text-[#216E4E]'
                              : 'bg-[#E9ECEF] text-[#495057]'
                          }`}
                        >
                          {task.completed ? 'Done' : 'To do'}
                        </span>
                      </div>

                      <div 
                        data-guide={filteredTasks[0]?.id === task.id ? 'task-actions' : undefined}
                        className="flex items-center justify-end gap-1"
                      >
                        {!task.completed && (
                          <>
                            <button
                              onClick={() => togglePinned(task)}
                              title={pinned ? 'Unpin task' : 'Pin task to top'}
                              className={`p-1.5 rounded cursor-pointer ${
                                pinned
                                  ? 'text-[#B45309] bg-[#FEF3C7]'
                                  : 'text-[#495057] hover:bg-[#FEF3C7] hover:text-[#B45309]'
                              }`}
                            >
                              <Pin className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleUrgent(task)}
                              title={
                                urgent
                                  ? 'Remove urgent tag'
                                  : 'Mark as urgent'
                              }
                              className={`p-1.5 rounded cursor-pointer ${
                                urgent
                                  ? 'text-[#A34A00] bg-[#FFEAD6]'
                                  : 'text-[#495057] hover:bg-[#FFEAD6] hover:text-[#A34A00]'
                              }`}
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => openEditModal(task)}
                          aria-label="Edit task"
                          className="p-1.5 rounded text-[#495057] hover:bg-[#21252914] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setTaskToDelete(task)}
                          aria-label="Delete task"
                          className="p-1.5 rounded text-[#495057] hover:bg-[#FFECEB] hover:text-[#C9372C] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Quick Add Task */}
          {!isFirstLoad && (
            <form
              data-guide="quick-add"
              onSubmit={handleQuickAdd}
              className={`shrink-0 relative flex items-center gap-3 px-4 h-12 transition-all duration-200 ${
                quickTitleAtLimit
                  ? 'border-2 border-[#D92D20] bg-[#FFF4F2] ring-2 ring-inset ring-[#D92D20]/15'
                  : quickTitleNearLimit
                    ? 'border border-[#F0B429] bg-[#FFFBEB] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#D97706]/15'
                    : 'border border-[#DEE2E6] bg-[#F8F9FA] focus-within:bg-white focus-within:border-[#2684FF] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#2684FF]/15'
              }`}
            >
              <Plus
                className={`w-5 h-5 shrink-0 ${
                  quickTitleAtLimit
                    ? 'text-[#D92D20]'
                    : quickTitleNearLimit
                      ? 'text-[#B54708]'
                      : 'text-[#5C636A]'
                }`}
              />

              <input
                type="text"
                aria-label="Task summary"
                aria-describedby="quick-title-counter"
                maxLength={QUICK_TITLE_MAX}
                placeholder={
                  isListening
                    ? 'Listening... speak your task summary'
                    : 'Create a task and press Enter'
                }
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm placeholder-[#5C636A] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              />

              <span
                id="quick-title-counter"
                className={`shrink-0 text-[11px] font-semibold tabular-nums transition-colors ${
                  quickTitleAtLimit
                    ? 'text-[#B42318]'
                    : quickTitleNearLimit
                      ? 'text-[#B54708]'
                      : 'text-[#5C636A]'
                }`}
              >
                {quickTitle.length}/{QUICK_TITLE_MAX}
              </span>

              {/* Microphone toggle button */}
              <button
                type="button"
                data-guide="quick-mic"
                onClick={() => setIsListening(!isListening)}
                title={isListening ? 'Stop listening' : 'Add task via voice'}
                aria-label={
                  isListening ? 'Stop listening' : 'Add task via voice'
                }
                aria-pressed={isListening}
                className={`shrink-0 p-2 rounded-full transition-all cursor-pointer ${
                  isListening
                    ? 'bg-[#C9372C] text-white animate-pulse'
                    : 'text-[#5C636A] hover:text-[#212529] hover:bg-[#E9ECEF]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Listening Indicator Popover */}
              {isListening && (
                <div className="absolute right-3 bottom-14 z-20 flex items-center gap-3 px-4 py-2.5 bg-[#212529] text-white rounded-lg shadow-lg border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4BCE97] animate-ping" />

                    <span className="w-1.5 h-3 rounded-full bg-[#4BCE97] animate-pulse" />

                    <span className="w-1.5 h-4 rounded-full bg-[#4BCE97] animate-pulse [animation-delay:150ms]" />

                    <span className="w-1.5 h-2 rounded-full bg-[#4BCE97] animate-pulse [animation-delay:300ms]" />
                  </div>

                  <div className="text-xs">
                    <p className="font-semibold text-white">
                      Listening for task...
                    </p>

                    <p className="text-white/60 text-[11px]">
                      Say your task title clearly
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsListening(false)}
                    className="ml-1 text-xs text-white/50 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  {/* Pointer arrow pointing to microphone */}
                  <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-[#212529] rotate-45 border-r border-b border-white/10" />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Daily Tasks Card */}
        <section
          data-guide="daily-card"
          aria-label="Daily tasks"
          className={`${
            cardsSideBySide || mobilePanel === 'daily' ? 'flex' : 'hidden'
          } min-w-0 min-h-0 flex-col bg-white border border-[#DEE2E6] rounded-md overflow-hidden`}
        >
          <div className="shrink-0 px-4 py-3 border-b border-[#DEE2E6] bg-[#F8F9FA]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Repeat className="w-4 h-4 text-[#495057] shrink-0" />

                <h2 className="text-sm font-semibold truncate">
                  Daily tasks
                </h2>
              </div>

              <span
                className={`text-xs font-semibold shrink-0 ${
                  allDailyDone ? 'text-[#216E4E]' : 'text-[#5C636A]'
                }`}
              >
                {allDailyDone
                  ? 'All done!'
                  : `${dailyDoneCount}/${dailyTasks.length} today`}
              </span>
            </div>

            <p className="text-xs text-[#5C636A] mt-0.5">
              Repeats every day · {todayLabel}
            </p>

            <div className="h-1.5 mt-2.5 rounded-full bg-[#E9ECEF] overflow-hidden">
              <div
                className="h-full bg-[#1F845A] transition-[width] duration-300"
                style={{
                  width: dailyTasks.length
                    ? `${(dailyDoneCount / dailyTasks.length) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          <div className="scrollbar-light flex-1 min-h-0 overflow-y-auto">
            {dailyTasks.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <p className="font-semibold">No daily tasks yet</p>

                <p className="text-sm text-[#5C636A] mt-1">
                  Add things you do every day, like reviewing emails or a
                  morning stand-up.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#DEE2E6]">
                {dailyTasks.map((daily) => {
                  const done = daily.lastCompleted === today;

                  return (
                    <li
                      key={daily.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors group"
                    >
                      <button
                        onClick={() => toggleDaily(daily)}
                        aria-label={
                          done
                            ? 'Mark as not done today'
                            : 'Mark as done today'
                        }
                        className="shrink-0 text-[#5C636A] hover:text-[#1F845A] transition-colors cursor-pointer"
                      >
                        {done ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1F845A]" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <span
                        title={daily.title}
                        className={`flex-1 min-w-0 truncate text-sm font-medium ${
                          done ? 'line-through text-[#5C636A]' : ''
                        }`}
                      >
                        {daily.title}
                      </span>

                      <button
                        onClick={() => deleteDaily(daily.id)}
                        aria-label="Remove daily task"
                        className="shrink-0 p-1.5 rounded text-[#495057] hover:bg-[#FFECEB] hover:text-[#C9372C] cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Add Daily Task */}
          <form
            onSubmit={handleAddDaily}
            className="shrink-0 flex items-center gap-3 px-4 h-12 border-t border-[#DEE2E6] bg-[#F8F9FA] transition-colors focus-within:bg-white focus-within:border-t-[#2684FF] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#2684FF]/15"
          >
            <Plus className="w-5 h-5 text-[#5C636A] shrink-0" />

            <input
              type="text"
              aria-label="Daily task summary"
              maxLength={100}
              placeholder="Add a daily task and press Enter"
              value={dailyTitle}
              onChange={(e) => setDailyTitle(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm placeholder-[#5C636A] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
          </form>
        </section>
      </div>
    </main>
  );
}