const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'https://woodworks-backend-75805996486.asia-southeast1.run.app';
const API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/tasks`;
const DAILY_API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/daily-tasks`;
const GROUPS_API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/groups`;

export const TOKEN_KEY = 'woodworks_token';
export const TASKS_CACHE_KEY = 'woodworks_tasks_cache';
export const REMEMBERED_EMAIL_KEY = 'woodworks_remembered_email';

// --- Task API Endpoints ---

export async function fetchTasksApi(token: string) {
  const response = await fetch(API_BASE_URL, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function createTaskApi(token: string, task: { title: string; description?: string; completed?: boolean; pinned?: boolean; urgent?: boolean; groupName?: string }) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: task.title,
      description: task.description || '',
      completed: task.completed || false,
      pinned: task.pinned || false,
      urgent: task.urgent || false,
      groupName: task.groupName || null
    })
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

export async function updateTaskApi(token: string, id: number, task: { title: string; description?: string; completed: boolean; pinned?: boolean; urgent?: boolean; groupName?: string }) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: task.title,
      description: task.description || '',
      completed: task.completed,
      pinned: task.pinned || false,
      urgent: task.urgent || false,
      groupName: task.groupName || null
    })
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function deleteTaskApi(token: string, id: number) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete task');
}

// --- Daily Tasks API Endpoints ---

export async function fetchDailyTasksApi(token: string) {
  const response = await fetch(DAILY_API_BASE_URL, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch daily tasks');
  return response.json();
}

export async function createDailyTaskApi(token: string, title: string) {
  const response = await fetch(DAILY_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, lastCompleted: null })
  });
  if (!response.ok) throw new Error('Failed to create daily task');
  return response.json();
}

export async function updateDailyTaskApi(token: string, id: number, updatedTask: any) {
  const response = await fetch(`${DAILY_API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updatedTask)
  });
  if (!response.ok) throw new Error('Failed to update daily task');
  return response.json();
}

export async function deleteDailyTaskApi(token: string, id: number) {
  const response = await fetch(`${DAILY_API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete daily task');
}

// --- Task Groups API Endpoints (New) ---

export async function fetchGroupsApi(token: string) {
  const response = await fetch(GROUPS_API_BASE_URL, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch task groups');
  return response.json();
}

export async function createGroupApi(token: string, name: string, color?: string) {
  const response = await fetch(GROUPS_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, color: color || null })
  });
  if (!response.ok) throw new Error('Failed to create task group');
  return response.json();
}

export async function deleteGroupApi(token: string, id: number) {
  const response = await fetch(`${GROUPS_API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete task group');
}