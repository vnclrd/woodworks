export interface Task {
  id: number | null;
  title: string;
  description: string;
  completed: boolean;
  pinned?: boolean;
  urgent?: boolean;
  /** Frontend-only until the backend stores task groups. */
  groupId?: string | null;
  groupName?: string | null;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface TaskGroup {
  id: string;
  name: string;
}

export interface DailyTask {
  id: number;
  title: string;
  lastCompleted: string | null;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'completion' | 'deletion' | 'info';
}