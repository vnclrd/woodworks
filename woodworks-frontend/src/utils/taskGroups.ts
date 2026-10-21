import type { Task } from '../types/task';
import { loadJSON } from './storage';

export function mergeLocalGroupAssignments(taskList: Task[], storageKey: string): Task[] {
  const assignments = loadJSON<Record<string, string>>(storageKey, {});
  return taskList.map((task) => ({
    ...task,
    groupId: task.groupId ?? (task.id === null ? null : assignments[String(task.id)] ?? null),
  }));
}
