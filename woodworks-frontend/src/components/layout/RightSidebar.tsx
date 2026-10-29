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
  Copy,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

interface RightSidebarProps {
  app: AppController;
}

const NOTES_KEY = 'woodworks_scratchpad';
const NOTES_MAX_LENGTH = 5000;
const SESSIONS_KEY = 'woodworks_pomodoro_sessions';
const SOUND_KEY = 'woodworks_pomodoro_sound';

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

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

// Friendly empty state used by several tabs (optional badge, e.g. "Coming soon")
function EmptyState({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="rounded-md bg-[#914000] px-4 py-10 text-center space-y-3">
      <div className="mx-auto w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs leading-5 text-[#FFE8D1] mt-1">{description}</p>
      </div>
      {badge && (
        <span className="inline-block rounded-sm bg-white px-1.5 text-[10px] font-bold uppercase leading-4 text-[#914000]">
          {badge}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Focus timer
// The timer state lives in the sidebar itself (not in the Timer tab), so it keeps running when you
// switch tabs. It measures real clock time, so it stays accurate even if the browser tab is in the background.
// ---------------------------------------------------------------------------

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const TIMER_DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const TIMER_LABELS: Record<TimerMode, string> = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function useFocusTimer(app: AppController) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [remaining, setRemaining] = useState(TIMER_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsToday, setSessionsToday] = useState<number>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) || 'null');
      return saved && saved.date === getTodayKey() ? Number(saved.count) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== 'off';
    } catch {
      return true;
    }
  });

  const endsAtRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const originalTitleRef = useRef('');
  const modeRef = useRef(mode);
  const sessionsRef = useRef(sessionsToday);
  const soundRef = useRef(soundOn);
  modeRef.current = mode;
  sessionsRef.current = sessionsToday;
  soundRef.current = soundOn;

  // Remember today's finished sessions and the sound preference
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify({ date: getTodayKey(), count: sessionsToday }));
    } catch {
      // Storage unavailable: counts just stay in memory
    }
  }, [sessionsToday]);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
    } catch {
      // Storage unavailable
    }
  }, [soundOn]);

  const playBeep = () => {
    const ctx = audioRef.current;
    if (!soundRef.current || !ctx) return;
    [0, 0.25, 0.5].forEach((offset) => {
      const start = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  };

  const goTo = (next: TimerMode) => {
    endsAtRef.current = null;
    setIsRunning(false);
    setMode(next);
    setRemaining(TIMER_DURATIONS[next]);
  };

  // Called when the countdown reaches zero: count the session and queue up the next phase (not auto-started)
  const finish = () => {
    endsAtRef.current = null;
    setIsRunning(false);
    playBeep();

    if (modeRef.current === 'work') {
      const count = sessionsRef.current + 1;
      setSessionsToday(count);
      const next: TimerMode = count % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(next);
      setRemaining(TIMER_DURATIONS[next]);
      app.showToast(count % 4 === 0 ? 'Great work! Time for a long break.' : 'Focus session complete! Take a short break.');
    } else {
      setMode('work');
      setRemaining(TIMER_DURATIONS.work);
      app.showToast('Break over. Ready for the next focus session?');
    }
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Countdown: derived from the clock, so background tabs and throttled timers don't cause drift
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      if (endsAtRef.current === null) return;
      const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) finishRef.current();
    }, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  // Show the countdown in the browser tab title while running (restored afterwards)
  useEffect(() => {
    if (!isRunning) return;
    originalTitleRef.current = document.title;
    return () => {
      document.title = originalTitleRef.current;
    };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) document.title = `${formatTime(remaining)} · ${TIMER_LABELS[mode]}`;
  }, [isRunning, remaining, mode]);

  const toggleRunning = () => {
    if (isRunning) {
      endsAtRef.current = null;
      setIsRunning(false);
      return;
    }
    if (remaining <= 0) return;
    // The audio context is created on this click, because browsers only allow sound after a user action
    if (!audioRef.current) {
      try {
        audioRef.current = new AudioContext();
      } catch {
        // No audio support: the timer still works silently
      }
    }
    void audioRef.current?.resume();
    endsAtRef.current = Date.now() + remaining * 1000;
    setIsRunning(true);
  };

  const reset = () => {
    endsAtRef.current = null;
    setIsRunning(false);
    setRemaining(TIMER_DURATIONS[mode]);
  };

  // Jump to the next phase without counting the session
  const skip = () => goTo(mode === 'work' ? 'shortBreak' : 'work');

  return {
    mode,
    remaining,
    isRunning,
    sessionsToday,
    soundOn,
    progress: 1 - remaining / TIMER_DURATIONS[mode],
    toggleRunning,
    reset,
    skip,
    switchMode: goTo,
    toggleSound: () => setSoundOn((prev) => !prev),
  };
}

type FocusTimer = ReturnType<typeof useFocusTimer>;

function ProductivityTimer({ app, timer }: { app: AppController; timer: FocusTimer }) {
  const { mode, remaining, isRunning, sessionsToday, soundOn, progress } = timer;

  const size = 176;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Four dots show how far you are in the current round (a long break comes after every 4th session)
  const filledDots = sessionsToday > 0 && sessionsToday % 4 === 0 && mode === 'longBreak' ? 4 : sessionsToday % 4;

  const modes: { key: TimerMode; label: string }[] = [
    { key: 'work', label: 'Pomodoro' },
    { key: 'shortBreak', label: 'Short Break' },
    { key: 'longBreak', label: 'Long Break' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
        <h3 className="font-semibold">Productivity Timer</h3>
        <button
          type="button"
          onClick={timer.toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Turn completion sound off' : 'Turn completion sound on'}
          title={soundOn ? 'Sound on' : 'Sound off'}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#7D3600] transition-colors cursor-pointer"
        >
          {soundOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
        </button>
      </div>

      {/* Mode selector (locked while running so a stray click can't wipe your progress) */}
      <div
        role="radiogroup"
        aria-label="Timer mode"
        className="grid grid-cols-3 gap-1 rounded bg-[#914000] p-1 text-xs font-medium"
      >
        {modes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={mode === key}
            disabled={isRunning && mode !== key}
            onClick={() => timer.switchMode(key)}
            title={isRunning && mode !== key ? 'Pause the timer to switch modes' : undefined}
            className={`py-1.5 rounded transition-colors ${
              mode === key
                ? 'bg-[#212529] text-white shadow-inner'
                : 'hover:bg-[#7D3600] disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Countdown ring */}
      <div className="rounded-lg bg-[#914000] p-5 flex flex-col items-center gap-4 shadow-inner">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span role="timer" aria-live="off" className="text-4xl font-mono font-bold tabular-nums tracking-wider">
              {formatTime(remaining)}
            </span>
            <span className="text-xs font-semibold mt-1">{TIMER_LABELS[mode]}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 w-full">
          <button
            type="button"
            onClick={timer.toggleRunning}
            className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded bg-[#212529] hover:bg-[#495057] text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            {isRunning ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={timer.reset}
            aria-label="Reset timer"
            title="Reset"
            className="w-11 h-11 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={timer.skip}
            aria-label={mode === 'work' ? 'Skip to break' : 'Skip to focus'}
            title={mode === 'work' ? 'Skip to break' : 'Skip to focus'}
            className="w-11 h-11 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 transition-colors cursor-pointer"
          >
            <SkipForward size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Today's progress + what you're working on */}
      <div className="rounded-md bg-[#914000] p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold">
            Today: {sessionsToday} {sessionsToday === 1 ? 'session' : 'sessions'}
            <span className="font-normal text-[#FFE8D1]"> · {sessionsToday * 25} min focused</span>
          </p>
          <div className="flex items-center gap-1" role="img" aria-label={`${filledDots} of 4 sessions done in this round`}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i < filledDots ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-[#FFE8D1] leading-5 truncate">
          {mode !== 'work'
            ? 'Take a breather. Step away from the screen for a bit.'
            : app.activeTask
              ? `Focusing on ${app.getTaskKey(app.activeTask)} · ${app.activeTask.title}`
              : 'Tip: select a task in your workspace to keep it in view while you focus.'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function RightSidebar({ app }: RightSidebarProps) {
  const { isSidebarCollapsed: isCollapsed, setIsSidebarCollapsed: setIsCollapsed } = app;
  const [activeTab, setActiveTab] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingClearNotes, setConfirmingClearNotes] = useState(false);

  const [isScratchpadDark, setIsScratchpadDark] = useState(false);

  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(NOTES_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const titleOnFocus = useRef('');
  const descOnFocus = useRef('');
  const timer = useFocusTimer(app);

  const activeTaskId = app.activeTask?.id;
  const activeFilterCount = [
    app.quickFilterPinned,
    app.quickFilterUrgent,
    app.quickFilterHasDesc,
    app.quickFilterHideDone,
  ].filter(Boolean).length;

  // When a different task is selected: reset the delete confirmation and jump to the Inspector tab
  useEffect(() => {
    setConfirmingDelete(false);
    if (activeTaskId !== undefined && activeTaskId !== null) setActiveTab(0);
  }, [activeTaskId]);

  // Leaving the Notes tab cancels a half-finished "clear notes"
  useEffect(() => {
    setConfirmingClearNotes(false);
  }, [activeTab]);

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

  // Small status markers on the tab icons, so important state is visible even from another tab
  const getBadge = (tabId: number) => {
    if (tabId === 0 && app.activeTask) return { kind: 'dot' as const, label: 'a task is selected' };
    if (tabId === 1 && timer.isRunning) return { kind: 'dot' as const, label: 'the timer is running' };
    if (tabId === 4 && activeFilterCount > 0) {
      return {
        kind: 'count' as const,
        value: activeFilterCount,
        label: `${activeFilterCount} ${activeFilterCount === 1 ? 'filter is' : 'filters are'} active`,
      };
    }
    return null;
  };

  const renderBadge = (tabId: number, position: string) => {
    const badge = getBadge(tabId);
    if (!badge) return null;
    return (
      <>
        {badge.kind === 'dot' ? (
          <span
            className={`absolute ${position} w-2 h-2 rounded-full bg-white ring-2 ring-[#BF5700] ${
              tabId === 1 ? 'animate-pulse motion-reduce:animate-none' : ''
            }`}
            aria-hidden="true"
          />
        ) : (
          <span
            className={`absolute ${position} min-w-4 h-4 px-1 rounded-full bg-white text-[10px] font-bold leading-4 text-center text-[#914000] ring-2 ring-[#BF5700]`}
            aria-hidden="true"
          >
            {badge.value}
          </span>
        )}
        <span className="sr-only">({badge.label})</span>
      </>
    );
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      app.showToast(successMessage);
    } catch {
      app.showToast('Copy failed. Select the text and copy it manually.');
    }
  };

  const renderInspector = () => {
    const task = app.activeTask;
    const taskKey = task ? app.getTaskKey(task) : '';
    const group = task && task.groupId != null
      ? app.groups.find((g) => String(g.id) === String(task.groupId))
      : undefined;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
          <h3 className="font-semibold">Task Inspector</h3>
          {task ? (
            <button
              type="button"
              onClick={() => copyText(taskKey, `Copied ${taskKey}`)}
              title="Copy task key"
              aria-label={`Copy task key ${taskKey}`}
              className="shrink-0 inline-flex items-center gap-1.5 rounded bg-[#212529] hover:bg-[#495057] px-2 py-0.5 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              {taskKey}
              <Copy size={12} aria-hidden="true" />
            </button>
          ) : (
            <span className="shrink-0 rounded bg-[#212529] px-2 py-0.5 text-xs font-medium text-white">
              No selection
            </span>
          )}
        </div>

        {task ? (
          <div className="space-y-4">
            {/* Status + Group Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-1.5 h-9 rounded text-[11px] font-bold uppercase ${
                  task.completed ? 'bg-[#DCFFF1] text-[#216E4E]' : 'bg-[#E9ECEF] text-[#495057]'
                }`}
              >
                {task.completed ? 'Done' : 'To do'}
              </span>
              <div className="flex-1 min-w-32.5">
                <select
                  aria-label="Task group"
                  value={task.groupId || ''}
                  onChange={(e) => {
                    const newGroupId = e.target.value ? e.target.value : null;
                    const targetGroup = app.groups.find((g) => String(g.id) === String(newGroupId));
                    const groupNameValue = targetGroup ? targetGroup.name : null;

                    const updated = { ...task, groupId: newGroupId, groupName: groupNameValue };
                    app.setTasks(app.tasks.map((t) => (t.id === task.id ? updated : t)));
                    app.updateTaskBackend(updated);
                    app.showToast(`Moved "${task.title}" to ${targetGroup ? targetGroup.name : 'No group'}`);
                  }}
                  className={`${fieldClass} h-9 text-xs`}
                >
                  <option value="">No group</option>
                  {app.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="inspector-title" className="block text-xs font-semibold mb-1">
                Title
              </label>
              <input
                id="inspector-title"
                type="text"
                maxLength={100}
                value={task.title}
                aria-invalid={!task.title.trim()}
                onFocus={() => { titleOnFocus.current = task.title; }}
                onChange={(e) => {
                  const updated = { ...task, title: e.target.value };
                  app.setTasks(app.tasks.map((t) => t.id === updated.id ? updated : t));
                }}
                onBlur={() => {
                  // A task can't have an empty title: put the previous one back instead of saving a blank
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
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-[#FFE8D1]">{task.title.length}/100</span> {/* <-- Add live counter */}
              </div>
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
                maxLength={1000}
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
                className={`${fieldClass} py-2 resize-none scrollbar-light`}
                placeholder="Add a detailed description..."
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-xs">
                  {task.title.trim()
                    ? 'Title and description save when you click away.'
                    : 'A title is required. The previous one is restored if you leave it empty.'}
                </p>
                <span className="text-[11px] text-[#FFE8D1]">{(task.description || '').length}/1000</span> {/* <-- Add live counter */}
              </div>
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
                    task.pinned ? 'bg-white text-[#212529]' : 'bg-[#914000] text-white hover:bg-[#7D3600]'
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
                    task.urgent ? 'bg-white text-[#212529]' : 'bg-[#914000] text-white hover:bg-[#7D3600]'
                  }`}
                >
                  <Flag size={16} aria-hidden="true" />
                  {task.urgent ? 'Urgent' : 'Mark urgent'}
                </button>
              </div>
            </div>

            {/* Actions */}
            {confirmingDelete ? (
              <div role="alertdialog" aria-label="Confirm delete" className="rounded-md bg-[#914000] p-3 space-y-3">
                <p className="text-sm">Delete {taskKey}? This can't be undone.</p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    autoFocus
                    className="h-9 px-3 rounded text-sm font-medium text-white hover:bg-[#7D3600] transition-colors cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded text-sm font-medium text-white hover:bg-[#7D3600] transition-colors cursor-pointer"
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
          <EmptyState
            icon={FileText}
            title="No task selected"
            description="Click any task in your workspace to view and edit its details here."
          />
        )}
      </div>
    );
  };

  const renderNotes = () => {
    const trimmed = notes.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

    return (
      <div className="h-full flex flex-col space-y-3">
        {/* Header with Dark Mode Toggle Button */}
        <div className="shrink-0 flex items-center justify-between gap-2 border-b border-white/20 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Scratchpad</h3>
            <button
              type="button"
              onClick={() => setIsScratchpadDark(!isScratchpadDark)}
              aria-label={isScratchpadDark ? 'Switch scratchpad to light mode' : 'Switch scratchpad to dark mode'}
              title={isScratchpadDark ? 'Light scratchpad' : 'Dark scratchpad'}
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              {isScratchpadDark ? 'Light' : 'Dark'}
            </button>
          </div>
          <span className="text-xs">Saved on this device</span>
        </div>

        {/* Textarea with conditional dark styling */}
        <textarea
          aria-label="Scratchpad notes"
          value={notes}
          maxLength={NOTES_MAX_LENGTH}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down notes..."
          className={`w-full rounded px-3 text-sm border-2 border-transparent focus:outline-none flex-1 min-h-48 py-2 resize-none transition-colors scrollbar-light ${
            isScratchpadDark
              ? 'bg-[#202020] text-white placeholder-white/40 focus:border-[#383838]'
              : 'bg-white text-[#212529] placeholder-[#5C636A] focus:border-[#212529]'
          }`}
        />

        <div className="shrink-0 flex items-center justify-between gap-2">
          <p className="text-xs">
            {wordCount} {wordCount === 1 ? 'word' : 'words'} · {notes.length}/{NOTES_MAX_LENGTH}
          </p>

          {confirmingClearNotes ? (
            <div className="flex items-center gap-1.5" role="alertdialog" aria-label="Confirm clearing notes">
              <span className="text-xs">Clear all notes?</span>
              <button
                type="button"
                onClick={() => setConfirmingClearNotes(false)}
                autoFocus
                className="h-8 px-2 rounded text-xs font-medium hover:bg-[#7D3600] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotes('');
                  setConfirmingClearNotes(false);
                }}
                className="h-8 px-2 rounded bg-white text-xs font-semibold text-[#AE2E24] hover:bg-[#FFECEB] transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => copyText(notes, 'Notes copied')}
                disabled={!notes}
                className="inline-flex items-center gap-1.5 h-8 px-2 rounded text-xs font-medium hover:bg-[#7D3600] transition-colors cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <Copy size={14} aria-hidden="true" />
                Copy
              </button>
              <button
                type="button"
                onClick={() => setConfirmingClearNotes(true)}
                disabled={!notes}
                className="inline-flex items-center gap-1.5 h-8 px-2 rounded text-xs font-medium hover:bg-[#7D3600] transition-colors cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <Trash2 size={14} aria-hidden="true" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivity = () => {
    const activities: any[] = app.activities || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
          <h3 className="font-semibold">Activity Stream</h3>
          <span className="text-xs">
            {activities.length > 0 ? `${activities.length} recent ${activities.length === 1 ? 'action' : 'actions'}` : 'Recent actions'}
          </span>
        </div>

        {activities.length > 0 ? (
          <ol className="ml-1.5 border-l border-white/30 space-y-3">
            {activities.map((act) => (
              <li key={act.id} className="relative pl-4">
                <span
                  className="absolute -left-1.25 top-3 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-[#BF5700]"
                  aria-hidden="true"
                />
                <div className="rounded bg-[#914000] p-2.5 text-xs space-y-1 shadow-sm">
                  <p className="font-medium wrap-break-words">{act.text}</p>
                  <p className="text-[11px] text-[#FFE8D1]">{act.time}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Your recent actions, like creating, completing or deleting tasks, will show up here."
          />
        )}
      </div>
    );
  };

  const renderFilters = () => {
    const quickFilters = [
      { key: 'pinned', label: 'Pinned tasks only', icon: Pin, active: !!app.quickFilterPinned, toggle: () => app.setQuickFilterPinned(!app.quickFilterPinned) },
      { key: 'urgent', label: 'Urgent tasks only', icon: Flag, active: !!app.quickFilterUrgent, toggle: () => app.setQuickFilterUrgent(!app.quickFilterUrgent) },
      { key: 'desc', label: 'Has description notes', icon: FileText, active: !!app.quickFilterHasDesc, toggle: () => app.setQuickFilterHasDesc(!app.quickFilterHasDesc) },
      { key: 'done', label: 'Hide completed tasks', icon: CheckCircle2, active: !!app.quickFilterHideDone, toggle: () => app.setQuickFilterHideDone(!app.quickFilterHideDone) },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
          <h3 className="font-semibold">Quick Filters</h3>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                app.setQuickFilterPinned(false);
                app.setQuickFilterUrgent(false);
                app.setQuickFilterHasDesc(false);
                app.setQuickFilterHideDone(false);
                app.showToast('Filters cleared');
              }}
              className="h-7 px-2 rounded text-xs font-medium hover:bg-[#7D3600] transition-colors cursor-pointer"
            >
              Reset all ({activeFilterCount})
            </button>
          ) : (
            <span className="text-xs">None active</span>
          )}
        </div>

        <div className="space-y-2" role="group" aria-label="Attribute filters">
          {quickFilters.map(({ key, label, icon: Icon, active, toggle }) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={active}
              onClick={toggle}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors cursor-pointer bg-[#914000] hover:bg-[#7D3600] ${
                active ? 'ring-2 ring-white' : ''
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Icon size={14} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{label}</span>
              </span>
              <span
                className={`shrink-0 w-9 h-5 rounded-full p-0.5 transition-colors motion-reduce:transition-none ${
                  active ? 'bg-white' : 'bg-white/30'
                }`}
                aria-hidden="true"
              >
                <span
                  className={`block w-4 h-4 rounded-full transition-transform motion-reduce:transition-none ${
                    active ? 'translate-x-4 bg-[#BF5700]' : 'translate-x-0 bg-white'
                  }`}
                />
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs leading-5 text-[#FFE8D1]">
          Filters combine with your search query and group selection. A number on the Filters tab shows how many are on.
        </p>
      </div>
    );
  };

  return (
    <aside
      aria-label="Workspace tools"
      className={`max-md:hidden h-full shrink-0 bg-[#BF5700] text-white border-l border-black/10 flex flex-col overflow-hidden transition-[width] duration-300 motion-reduce:transition-none ${
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
                data-guide={`tab-${tab.id}`}
                onClick={() => { setActiveTab(idx); setIsCollapsed(false); }}
                aria-label={tab.label}
                title={tab.id === 1 && timer.isRunning ? `Timer · ${formatTime(timer.remaining)} left` : tab.label}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'bg-[#212529]' : 'hover:bg-[#A34A00]'
                }`}
              >
                <Icon size={20} />
                {renderBadge(tab.id, 'top-1 right-1')}
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

          {/* Tabs: icon + label so every tool is easy to recognize. The Timer label shows the countdown while it runs. */}
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
                  data-guide={`tab-${tab.id}`}
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
                  <span className="text-[11px] leading-none font-medium tabular-nums">
                    {tab.id === 1 && timer.isRunning ? formatTime(timer.remaining) : tab.label}
                  </span>
                  {renderBadge(tab.id, 'top-1 right-2')}
                </button>
              );
            })}
          </div>

          {/* Tab content (scrolls on its own so the header and tabs stay put) */}
          <div
            id="rs-panel"
            role="tabpanel"
            aria-labelledby={`rs-tab-${activeTab}`}
            className="scrollbar-on-orange flex-1 min-h-0 overflow-y-auto p-4"
          >
            {activeTab === 0 && renderInspector()}
            {activeTab === 1 && <ProductivityTimer app={app} timer={timer} />}
            {activeTab === 2 && renderNotes()}
            {activeTab === 3 && renderActivity()}
            {activeTab === 4 && renderFilters()}
          </div>
        </>
      )}
    </aside>
  );
}