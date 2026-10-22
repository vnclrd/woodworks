import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  FileText,
  Timer,
  StickyNote,
  Activity,
  ListFilter,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  Flag,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

interface RightSidebarProps {
  app: AppController;
}

const NOTES_KEY = 'woodworks_scratchpad';
const NOTES_MAX_LENGTH = 5000;

const TABS = [
  { id: 0, label: 'Inspector', icon: FileText },
  { id: 1, label: 'Timer', icon: Timer },
  { id: 2, label: 'Notes', icon: StickyNote },
  { id: 3, label: 'Activity', icon: Activity },
  { id: 4, label: 'Filters', icon: ListFilter },
];

// Inputs sit on the orange bar, so they are white with dark text for contrast (same as the AI chat box)
const fieldClass =
  'w-full rounded bg-white px-3 text-sm text-[#212529] placeholder-[#5C636A] border-2 border-transparent focus:outline-none focus:border-[#212529]';

// Friendly placeholder for tools that are not built yet
function ComingSoon({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="rounded-md bg-[#A34A00] px-4 py-8 text-center space-y-3">
      <div className="mx-auto w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs leading-5 text-[#FFE8D1] mt-1">{description}</p>
      </div>
      <span className="inline-block rounded-sm bg-white px-1.5 text-[10px] font-bold uppercase leading-4 text-[#A34A00]">
        Coming soon
      </span>
    </div>
  );
}

function ProductivityTimer({ app }: { app: AppController }) {
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);

  // Timer configuration presets (in seconds)
  const durations = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      app.showToast(mode === 'work' ? 'Pomodoro session completed! Take a break.' : 'Break ended. Time to work!');
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(durations[newMode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/20 pb-3">
        <h3 className="font-semibold">Productivity Timer</h3>
        <span className="shrink-0 rounded bg-[#212529] px-2 py-0.5 text-xs font-medium text-white capitalize">
          {mode === 'work' ? 'Work Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded bg-[#914000] p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => switchMode('work')}
          className={`py-1.5 rounded transition-colors cursor-pointer ${mode === 'work' ? 'bg-[#212529] text-white shadow-inner' : 'hover:bg-[#7D3600]'}`}
        >
          Pomodoro
        </button>
        <button
          type="button"
          onClick={() => switchMode('shortBreak')}
          className={`py-1.5 rounded transition-colors cursor-pointer ${mode === 'shortBreak' ? 'bg-[#212529] text-white shadow-inner' : 'hover:bg-[#7D3600]'}`}
        >
          Short Break
        </button>
        <button
          type="button"
          onClick={() => switchMode('longBreak')}
          className={`py-1.5 rounded transition-colors cursor-pointer ${mode === 'longBreak' ? 'bg-[#212529] text-white shadow-inner' : 'hover:bg-[#7D3600]'}`}
        >
          Long Break
        </button>
      </div>

      {/* Timer Display Circle / Box */}
      <div className="relative rounded-lg bg-[#914000] p-6 text-center space-y-4 shadow-inner">
        <div className="text-4xl font-mono font-bold tracking-wider text-white">
          {formatTime(timeLeft)}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="h-10 px-6 rounded bg-[#212529] hover:bg-[#495057] text-sm font-semibold text-white transition-colors cursor-pointer shadow"
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durations[mode]);
            }}
            className="h-10 px-4 rounded bg-white/15 hover:bg-white/25 text-sm font-medium text-white transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-[#FFE8D1] text-center">
        Stay focused on your selected task or log your work intervals.
      </p>
    </div>
  );
}

export default function RightSidebar({ app }: RightSidebarProps) {
  const { isSidebarCollapsed: isCollapsed, setIsSidebarCollapsed: setIsCollapsed } = app;
  const [activeTab, setActiveTab] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(NOTES_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const titleOnFocus = useRef('');
  const descOnFocus = useRef('');

  const activeTaskId = app.activeTask?.id;

  // When a different task is selected: reset the delete confirmation and jump to the Inspector tab
  useEffect(() => {
    setConfirmingDelete(false);
    if (activeTaskId !== undefined && activeTaskId !== null) setActiveTab(0);
  }, [activeTaskId]);

  // Keep the scratchpad between tab switches and page reloads
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, notes);
    } catch {
      // Storage unavailable: notes simply stay in memory
    }
  }, [notes]);

  // Arrow keys / Home / End move between tabs (standard tab keyboard behavior)
  const handleTabKeyDown = (e: ReactKeyboardEvent) => {
    const last = TABS.length - 1;
    let next = activeTab;
    if (e.key === 'ArrowRight') next = activeTab === last ? 0 : activeTab + 1;
    else if (e.key === 'ArrowLeft') next = activeTab === 0 ? last : activeTab - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;

    e.preventDefault();
    setActiveTab(next);
    document.getElementById(`rs-tab-${next}`)?.focus();
  };

  const renderInspector = () => {
    const task = app.activeTask;
    const group = task && task.groupId != null
      ? app.groups.find((g) => String(g.id) === String(task.groupId))
      : undefined;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
          <h3 className="font-semibold">Task Inspector</h3>
          <span className="shrink-0 rounded bg-[#212529] px-2 py-0.5 text-xs font-medium text-white">
            {task ? app.getTaskKey(task) : 'No selection'}
          </span>
        </div>

        {task ? (
          <div className="space-y-4">
            {/* Status + group (read only) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase ${
                  task.completed ? 'bg-[#DCFFF1] text-[#216E4E]' : 'bg-[#E9ECEF] text-[#495057]'
                }`}
              >
                {task.completed ? 'Done' : 'To do'}
              </span>
              {group && (
                <span className="inline-flex items-center max-w-full rounded-sm bg-[#F1F3F5] px-1.5 h-5 text-[11px] font-medium text-[#495057]">
                  <span className="truncate">{group.name}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="inspector-title" className="block text-xs font-semibold mb-1">
                Title
              </label>
              <input
                id="inspector-title"
                type="text"
                value={task.title}
                aria-invalid={!task.title.trim()}
                onFocus={() => { titleOnFocus.current = task.title; }}
                onChange={(e) => {
                  const updated = { ...task, title: e.target.value };
                  app.setTasks(app.tasks.map((t) => t.id === updated.id ? updated : t));
                }}
                onBlur={() => {
                  if (!task.title.trim()) {
                    app.setTasks(app.tasks.map((t) => t.id === task.id ? { ...t, title: titleOnFocus.current } : t));
                    return;
                  }
                  // Only save if the title actually changed
                  if (task.title !== titleOnFocus.current) {
                    app.updateTaskBackend(task);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className={`${fieldClass} h-10`}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="inspector-description" className="block text-xs font-semibold mb-1">
                Description
              </label>
              <textarea
                id="inspector-description"
                rows={5}
                value={task.description || ''}
                onFocus={() => { descOnFocus.current = task.description || ''; }}
                onChange={(e) => {
                  const updated = { ...task, description: e.target.value };
                  app.setTasks(app.tasks.map((t) => t.id === updated.id ? updated : t));
                }}
                onBlur={() => {
                  // Only save if the description actually changed
                  if ((task.description || '') !== descOnFocus.current) {
                    app.updateTaskBackend(task);
                  }
                }}
                className={`${fieldClass} py-2 resize-none`}
                placeholder="Add a detailed description..."
              />
              <p className="text-xs mt-1.5">
                {task.title.trim()
                  ? 'Title and description save when you click away.'
                  : 'A title is required. The previous one is restored if you leave it empty.'}
              </p>
            </div>

            {/* Priority toggles */}
            <div>
              <p className="text-xs font-semibold mb-1">Priority</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => app.togglePinned(task)}
                  aria-pressed={!!task.pinned}
                  title="Pinned tasks are shown above all others"
                  className={`flex-1 h-10 inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition-colors cursor-pointer ${
                    task.pinned ? 'bg-white text-[#212529]' : 'bg-[#A34A00] text-white hover:bg-[#8F4000]'
                  }`}
                >
                  <Pin size={16} aria-hidden="true" />
                  {task.pinned ? 'Pinned' : 'Pin to top'}
                </button>
                <button
                  type="button"
                  onClick={() => app.toggleUrgent(task)}
                  aria-pressed={!!task.urgent}
                  title="Urgent tasks are shown below pinned tasks"
                  className={`flex-1 h-10 inline-flex items-center justify-center gap-2 rounded text-sm font-medium transition-colors cursor-pointer ${
                    task.urgent ? 'bg-white text-[#212529]' : 'bg-[#A34A00] text-white hover:bg-[#8F4000]'
                  }`}
                >
                  <Flag size={16} aria-hidden="true" />
                  {task.urgent ? 'Urgent' : 'Mark urgent'}
                </button>
              </div>
            </div>

            {/* Actions */}
            {confirmingDelete ? (
              <div role="alertdialog" aria-label="Confirm delete" className="rounded-md bg-[#A34A00] p-3 space-y-3">
                <p className="text-sm">Delete {app.getTaskKey(task)}? This can't be undone.</p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    autoFocus
                    className="h-9 px-3 rounded text-sm font-medium text-white hover:bg-[#8F4000] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      app.handleDeleteTask(task.id);
                      app.setActiveTaskId(null);
                    }}
                    className="h-9 px-3 rounded bg-white text-sm font-semibold text-[#AE2E24] hover:bg-[#FFECEB] transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 flex items-center justify-between gap-2 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded text-sm font-medium text-white hover:bg-[#8F4000] transition-colors cursor-pointer"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Delete task
                </button>
                <button
                  type="button"
                  onClick={() => app.setActiveTaskId(null)}
                  className="h-9 px-3 rounded bg-[#212529] hover:bg-[#495057] text-sm font-medium text-white transition-colors cursor-pointer"
                >
                  Close inspector
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md bg-[#A34A00] px-4 py-10 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
              <FileText size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">No task selected</p>
              <p className="text-xs leading-5 text-[#FFE8D1] mt-1">
                Click any task in your workspace to view and edit its details here.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      aria-label="Workspace tools"
      className={`h-full shrink-0 bg-[#BF5700] text-white border-l border-black/10 flex flex-col overflow-hidden transition-[width] duration-300 motion-reduce:transition-none ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      {isCollapsed ? (
        // Collapsed rail: vertical icon stack
        <div className="flex flex-col items-center gap-2 py-3 flex-1 min-h-0 overflow-y-auto">
          <button
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
            aria-expanded={false}
            title="Expand sidebar"
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#A34A00] transition-colors cursor-pointer"
          >
            <PanelRightOpen size={20} />
          </button>
          <div className="w-8 border-t border-white/25 my-1" role="separator" />
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(idx); setIsCollapsed(false); }}
                aria-label={tab.label}
                title={tab.label}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'bg-[#212529]' : 'hover:bg-[#A34A00]'
                }`}
              >
                <Icon size={20} />
                {tab.id === 0 && app.activeTask && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white ring-2 ring-[#BF5700]" aria-hidden="true" />
                    <span className="sr-only">(a task is selected)</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-14 border-b border-white/20">
            <h2 className="text-sm font-semibold truncate">Workspace tools</h2>
            <button
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse sidebar"
              aria-expanded={true}
              title="Collapse sidebar"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#A34A00] transition-colors cursor-pointer"
            >
              <PanelRightClose size={20} />
            </button>
          </div>

          {/* Tabs: icon + label so every tool is easy to recognize */}
          <div
            role="tablist"
            aria-label="Workspace tools"
            onKeyDown={handleTabKeyDown}
            className="shrink-0 grid grid-cols-5 gap-1 p-2 border-b border-white/20"
          >
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  id={`rs-tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="rs-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(idx)}
                  className={`relative flex flex-col items-center gap-1 px-1 py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive ? 'bg-[#212529]' : 'hover:bg-[#A34A00]'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span className="text-[11px] leading-none font-medium">{tab.label}</span>
                  {tab.id === 0 && app.activeTask && (
                    <>
                      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-white ring-2 ring-[#BF5700]" aria-hidden="true" />
                      <span className="sr-only">(a task is selected)</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content (scrolls on its own so the header and tabs stay put) */}
          <div
            id="rs-panel"
            role="tabpanel"
            aria-labelledby={`rs-tab-${activeTab}`}
            className="flex-1 min-h-0 overflow-y-auto p-4"
          >
            {activeTab === 0 && renderInspector()}

            {activeTab === 1 && (() => {
              return <ProductivityTimer app={app} />;
            })()}

            {activeTab === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">Scratchpad</h3>
                  <span className="text-xs">Saved on this device</span>
                </div>
                <textarea
                  aria-label="Scratchpad notes"
                  value={notes}
                  maxLength={NOTES_MAX_LENGTH}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jot down notes..."
                  className={`${fieldClass} h-56 py-2 resize-none`}
                />
                <p className="text-xs text-right">{notes.length}/{NOTES_MAX_LENGTH}</p>
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <h3 className="font-semibold">Activity Stream</h3>
                  <span className="text-xs text-[#FFE8D1]">Recent actions</span>
                </div>

                <div className="space-y-2 max-h-100 overflow-y-auto pr-1">
                  {app.activities && app.activities.length > 0 ? (
                    app.activities.map((act: any) => (
                      <div key={act.id} className="rounded bg-[#914000] p-2.5 text-xs space-y-1 shadow-sm">
                        <p className="text-white font-medium">{act.text}</p>
                        <p className="text-[10px] text-[#FFE8D1]/70">{act.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-[#FFE8D1]/70">
                      No activity recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <h3 className="font-semibold">Quick Filters</h3>
                  {(app.quickFilterPinned || app.quickFilterUrgent || app.quickFilterHasDesc || app.quickFilterHideDone) && (
                    <button
                      type="button"
                      onClick={() => {
                        app.setQuickFilterPinned(false);
                        app.setQuickFilterUrgent(false);
                        app.setQuickFilterHasDesc(false);
                        app.setQuickFilterHideDone(false);
                        app.showToast('Filters cleared');
                      }}
                      className="text-xs text-[#FFE8D1] hover:underline cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#FFE8D1]">Attribute Filters</p>
                  
                  <button
                    type="button"
                    onClick={() => app.setQuickFilterPinned(!app.quickFilterPinned)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      app.quickFilterPinned ? 'bg-white text-[#212529]' : 'bg-[#914000] text-white hover:bg-[#7D3600]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Pin size={14} aria-hidden="true" /> Pinned tasks only
                    </span>
                    <span className={`w-2 h-2 rounded-full ${app.quickFilterPinned ? 'bg-[#BF5700]' : 'bg-white/30'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => app.setQuickFilterUrgent(!app.quickFilterUrgent)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      app.quickFilterUrgent ? 'bg-white text-[#212529]' : 'bg-[#914000] text-white hover:bg-[#7D3600]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Flag size={14} aria-hidden="true" /> Urgent tasks only
                    </span>
                    <span className={`w-2 h-2 rounded-full ${app.quickFilterUrgent ? 'bg-[#BF5700]' : 'bg-white/30'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => app.setQuickFilterHasDesc(!app.quickFilterHasDesc)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      app.quickFilterHasDesc ? 'bg-white text-[#212529]' : 'bg-[#914000] text-white hover:bg-[#7D3600]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={14} aria-hidden="true" /> Has description notes
                    </span>
                    <span className={`w-2 h-2 rounded-full ${app.quickFilterHasDesc ? 'bg-[#BF5700]' : 'bg-white/30'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => app.setQuickFilterHideDone(!app.quickFilterHideDone)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      app.quickFilterHideDone ? 'bg-white text-[#212529]' : 'bg-[#914000] text-white hover:bg-[#7D3600]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} aria-hidden="true" /> Hide completed tasks
                    </span>
                    <span className={`w-2 h-2 rounded-full ${app.quickFilterHideDone ? 'bg-[#BF5700]' : 'bg-white/30'}`} />
                  </button>
                </div>

                <p className="text-xs text-[#FFE8D1] pt-2">
                  Filters combine dynamically with your search query and group selections.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}