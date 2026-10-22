const urlParams = new URLSearchParams(window.location.search);
export const isDemoMode = urlParams.get('demo') === 'true' || (import.meta as any).env.VITE_DEMO_MODE === 'true';

export const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'https://woodworks-backend-75805996486.asia-southeast1.run.app';
export const API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/tasks`;
export const DAILY_API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/daily-tasks`;

export const TOKEN_KEY = 'woodworks_token';
export const TASKS_CACHE_KEY = 'woodworks_tasks_cache';
export const REMEMBERED_EMAIL_KEY = 'woodworks_remembered_email';
export const DAILY_KEY = isDemoMode ? 'woodworks_demo_daily_tasks' : 'woodworks_daily_tasks';
export const GROUPS_KEY = isDemoMode ? 'woodworks_demo_task_groups' : 'woodworks_task_groups';
export const TASK_GROUP_ASSIGNMENTS_KEY = isDemoMode
  ? 'woodworks_demo_task_group_assignments'
  : 'woodworks_task_group_assignments';