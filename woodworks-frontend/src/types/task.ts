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
  type: 'success' | 'error';
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}
