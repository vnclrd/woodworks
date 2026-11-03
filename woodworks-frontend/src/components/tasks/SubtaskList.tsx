import {
  Check,
  ListChecks,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { BASE_URL } from '../../config/appConfig';
import { isFreeRole } from '../../config/plans';
import type { AppController } from '../../hooks/useAppController';
import type { Task } from '../../types/task';

type Subtask = NonNullable<Task['subtasks']>[number];

type Props = {
  app: AppController;
  taskId: number | null;
  /** 'panel' = on the orange inspector, 'surface' = on a normal themed card/sheet */
  tone?: 'panel' | 'surface';
  /** Put the "add" field above the list (used in the phone sheet so the keyboard never covers it) */
  addFirst?: boolean;
  /** Called right before the plans modal opens (lets a sheet close itself first) */
  onUpgrade?: () => void;
};

const SUBTASK_MAX = 100;

const STYLES = {
  panel: {
    text: 'text-white',
    muted: 'text-[#FFE8D1]',
    track: 'bg-white/25',
    fill: 'bg-white',
    fillDone: 'bg-[#4BCE97]',
    row: 'bg-[#914000] hover:bg-[#7D3600]',
    box: 'border-white bg-transparent',
    boxDone: 'border-white bg-white text-[#914000]',
    done: 'line-through text-[#FFE8D1]/60',
    iconBtn: 'text-white/70 hover:text-white hover:bg-white/15',
    deleteBtn: 'text-white/70 hover:text-white hover:bg-white/15',
    input:
      'bg-white text-[#212529] placeholder-[#5C636A] border-2 border-transparent focus:border-[#212529]',
    addBtn: 'bg-[#212529] hover:bg-[#495057] text-white',
    empty: 'border border-dashed border-white/40 text-[#FFE8D1]',
    lockBox: 'bg-[#914000] text-white',
    lockBtn: 'bg-white text-[#914000] hover:bg-[#FFE8D1]',
    doneBox: 'bg-white/15 text-white',
    doneBtn: 'bg-white text-[#914000] hover:bg-[#FFE8D1]',
  },
  surface: {
    text: 'text-fg',
    muted: 'text-fg-3',
    track: 'bg-line',
    fill: 'bg-[#BF5700]',
    fillDone: 'bg-ok',
    row: 'border border-line bg-subtle hover:bg-tint',
    box: 'border-fg-4 bg-surface',
    boxDone: 'border-ok bg-ok text-surface',
    done: 'line-through text-fg-3',
    iconBtn: 'text-fg-3 hover:text-fg hover:bg-tint',
    deleteBtn: 'text-fg-3 hover:text-danger hover:bg-danger-bg',
    input:
      'bg-surface text-fg placeholder-fg-3 border-2 border-line focus:border-fg',
    addBtn: 'bg-[#BF5700] hover:bg-[#914000] text-white',
    empty: 'border border-dashed border-line text-fg-3',
    lockBox: 'border border-line bg-subtle text-fg',
    lockBtn: 'bg-[#BF5700] hover:bg-[#914000] text-white',
    doneBox: 'bg-ok-bg text-ok',
    doneBtn: 'bg-primary hover:bg-primary-hover text-white',
  },
} as const;

export default function SubtaskList({
  app,
  taskId,
  tone = 'surface',
  addFirst = false,
  onUpgrade,
}: Props) {
  const s = STYLES[tone];
  const task = app.tasks.find((t) => t.id === taskId);

  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<Subtask['id'] | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const editingIdRef = useRef<Subtask['id'] | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  if (!task) return null;

  const api = `${BASE_URL.replace(/\/$/, '')}/api/subtasks`;
  const locked = !app.isDemoMode && isFreeRole(app.userRole);

  const subtasks: Subtask[] = task.subtasks ?? [];
  const total = subtasks.length;
  const done = subtasks.filter((sub) => sub.completed).length;
  const percent = total > 0 ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;

  // Always update from the latest list so quick successive changes never overwrite each other
  const patchSubtasks = (fn: (list: Subtask[]) => Subtask[]) =>
    app.setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, subtasks: fn(t.subtasks ?? []) } : t,
      ),
    );

  const request = async (path: string, method: string, body?: unknown) => {
    const res = await fetch(`${api}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${app.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res;
  };

  // ----- actions (all update the screen first, then roll back if the server says no) -----

  const toggle = async (sub: Subtask) => {
    const completed = !sub.completed;
    patchSubtasks((list) =>
      list.map((x) => (x.id === sub.id ? { ...x, completed } : x)),
    );
    if (app.isDemoMode) return;
    try {
      await request(`/${sub.id}`, 'PUT', { title: sub.title, completed });
    } catch {
      patchSubtasks((list) =>
        list.map((x) =>
          x.id === sub.id ? { ...x, completed: sub.completed } : x,
        ),
      );
      app.showToast('Could not update subtask', 'error');
    }
  };

  const startEdit = (sub: Subtask) => {
    editingIdRef.current = sub.id;
    setEditingId(sub.id);
    setEditDraft(sub.title);
  };

  const finishEdit = async (sub: Subtask, save: boolean) => {
    if (editingIdRef.current !== sub.id) return; // already finished (Enter then blur)
    editingIdRef.current = null;
    setEditingId(null);

    const title = editDraft.trim();
    if (!save || !title || title === sub.title) return;

    patchSubtasks((list) =>
      list.map((x) => (x.id === sub.id ? { ...x, title } : x)),
    );
    if (app.isDemoMode) return;
    try {
      await request(`/${sub.id}`, 'PUT', { title, completed: sub.completed });
    } catch {
      patchSubtasks((list) =>
        list.map((x) => (x.id === sub.id ? { ...x, title: sub.title } : x)),
      );
      app.showToast('Could not rename subtask', 'error');
    }
  };

  const remove = async (sub: Subtask, index: number) => {
    patchSubtasks((list) => list.filter((x) => x.id !== sub.id));
    if (app.isDemoMode) return;
    try {
      await request(`/${sub.id}`, 'DELETE');
    } catch {
      patchSubtasks((list) => {
        const next = [...list];
        next.splice(Math.min(index, next.length), 0, sub);
        return next;
      });
      app.showToast('Could not delete subtask', 'error');
    }
  };

  const add = async () => {
    const title = draft.trim();
    if (!title || adding || !task.id) return;

    if (app.isDemoMode) {
      patchSubtasks((list) => [
        ...list,
        { id: Date.now(), title, completed: false },
      ]);
      setDraft('');
      addInputRef.current?.focus();
      return;
    }

    setAdding(true);
    try {
      const res = await request(`/task/${task.id}`, 'POST', { title });
      const created: Subtask = await res.json();
      patchSubtasks((list) => [...list, created]);
      setDraft('');
    } catch {
      // The text stays in the field so nothing is lost
      app.showToast('Could not add subtask', 'error');
    } finally {
      setAdding(false);
      requestAnimationFrame(() => addInputRef.current?.focus());
    }
  };

  // ----- pieces -----

  const addForm = locked ? (
    <div className={`rounded-md p-3 ${s.lockBox}`}>
      <div className='flex items-start gap-2.5'>
        <Lock size={16} className='mt-0.5 shrink-0' aria-hidden='true' />
        <div className='min-w-0'>
          <p className='text-sm font-semibold'>Subtasks are a Premium feature</p>
          <p className={`text-xs mt-0.5 ${s.muted}`}>
            Break big tasks into steps and track your progress.
          </p>
          <button
            type='button'
            onClick={() => {
              onUpgrade?.();
              app.setIsPlansModalOpen(true);
            }}
            className={`mt-2.5 h-8 px-3 rounded text-xs font-semibold transition-colors cursor-pointer ${s.lockBtn}`}
          >
            See plans
          </button>
        </div>
      </div>
    </div>
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
      className='flex gap-2'
    >
      <input
        ref={addInputRef}
        type='text'
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={adding}
        maxLength={SUBTASK_MAX}
        enterKeyHint='done'
        aria-label='New subtask'
        placeholder='Add a subtask'
        style={{ outline: 'none', boxShadow: 'none' }}
        className={`flex-1 min-w-0 h-9 rounded px-3 text-sm ${s.input}`}
      />
      <button
        type='submit'
        disabled={!draft.trim() || adding}
        aria-label='Add subtask'
        className={`h-9 w-9 shrink-0 rounded flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${s.addBtn}`}
      >
        {adding ? (
          <Loader2 size={16} className='animate-spin' aria-hidden='true' />
        ) : (
          <Plus size={16} aria-hidden='true' />
        )}
      </button>
    </form>
  );

  return (
    <section aria-label='Subtasks' className={s.text}>
      {/* Header + progress */}
      <div className='flex items-center justify-between gap-2'>
        <p className='text-xs font-semibold flex items-center gap-1.5'>
          <ListChecks size={14} aria-hidden='true' />
          Subtasks
          {total > 0 && (
            <span className={`font-normal tabular-nums ${s.muted}`}>
              {done}/{total}
            </span>
          )}
        </p>
      </div>

      {total > 0 && (
        <div
          role='progressbar'
          aria-label='Subtask progress'
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className={`mt-2 h-1.5 rounded-full overflow-hidden ${s.track}`}
        >
          <div
            className={`h-full transition-[width] duration-300 ${allDone ? s.fillDone : s.fill}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {/* Nudge to finish the parent task once every step is done */}
      {allDone && !task.completed && (
        <div
          className={`mt-2.5 flex items-center justify-between gap-2 rounded-md px-3 py-2 ${s.doneBox}`}
        >
          <span className='flex items-center gap-1.5 text-xs font-medium'>
            <Check size={14} strokeWidth={3} aria-hidden='true' />
            All subtasks done
          </span>
          <button
            type='button'
            onClick={() => app.toggleComplete(task)}
            className={`h-7 px-2.5 rounded text-xs font-semibold shrink-0 transition-colors cursor-pointer ${s.doneBtn}`}
          >
            Mark task done
          </button>
        </div>
      )}

      {addFirst && <div className='mt-3'>{addForm}</div>}

      {/* List */}
      {total > 0 ? (
        <ul className='mt-3 space-y-1.5'>
          {subtasks.map((sub, index) => {
            const isEditing = editingId === sub.id;
            return (
              <li
                key={sub.id ?? `sub_${index}`}
                className={`group flex items-start gap-0.5 rounded-md pr-1 transition-colors ${s.row}`}
              >
                <button
                  type='button'
                  role='checkbox'
                  aria-checked={sub.completed}
                  aria-label={`${sub.completed ? 'Mark not done' : 'Mark done'}: ${sub.title}`}
                  onClick={() => toggle(sub)}
                  className='h-9 w-9 shrink-0 flex items-center justify-center cursor-pointer'
                >
                  <span
                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-colors ${
                      sub.completed ? s.boxDone : s.box
                    }`}
                  >
                    {sub.completed && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>

                {isEditing ? (
                  <input
                    autoFocus
                    type='text'
                    value={editDraft}
                    maxLength={SUBTASK_MAX}
                    aria-label='Rename subtask'
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onBlur={() => finishEdit(sub, true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEdit(sub, true);
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        finishEdit(sub, false);
                      }
                    }}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className={`flex-1 min-w-0 h-7 my-1 rounded px-2 text-sm ${s.input}`}
                  />
                ) : (
                  <button
                    type='button'
                    onClick={() => toggle(sub)}
                    className={`flex-1 min-w-0 py-2 text-left text-sm leading-5 wrap-break-word cursor-pointer ${
                      sub.completed ? s.done : ''
                    }`}
                  >
                    {sub.title}
                  </button>
                )}

                {!isEditing && (
                  <div className='flex items-center shrink-0 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100 transition-opacity'>
                    <button
                      type='button'
                      onClick={() => startEdit(sub)}
                      aria-label={`Rename subtask: ${sub.title}`}
                      title='Rename'
                      className={`h-9 w-8 flex items-center justify-center rounded transition-colors cursor-pointer ${s.iconBtn}`}
                    >
                      <Pencil size={14} aria-hidden='true' />
                    </button>
                    <button
                      type='button'
                      onClick={() => remove(sub, index)}
                      aria-label={`Delete subtask: ${sub.title}`}
                      title='Delete'
                      className={`h-9 w-8 flex items-center justify-center rounded transition-colors cursor-pointer ${s.deleteBtn}`}
                    >
                      <Trash2 size={14} aria-hidden='true' />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        !locked && (
          <p
            className={`mt-3 rounded-md px-3 py-3 text-xs ${s.empty}`}
          >
            No subtasks yet. Break this task into smaller steps.
          </p>
        )
      )}

      {!addFirst && <div className='mt-3'>{addForm}</div>}
    </section>
  );
}