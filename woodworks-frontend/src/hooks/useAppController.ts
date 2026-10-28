import { CheckSquare, Clock, Flag, ListTodo } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  API_BASE_URL,
  BASE_URL,
  DAILY_API_BASE_URL,
  DAILY_KEY,
  GROUPS_KEY,
  isDemoMode,
  REMEMBERED_EMAIL_KEY,
  TASK_GROUP_ASSIGNMENTS_KEY,
  TASKS_CACHE_KEY,
  TOKEN_KEY,
} from '../config/appConfig';
import {
  createGroupApi,
  deleteGroupApi,
  fetchGroupsApi,
} from '../services/woodworksApi';
import type { DailyTask, Task, TaskGroup, Toast } from '../types/task';
import { getTodayKey, loadJSON } from '../utils/storage';
import { mergeLocalGroupAssignments } from '../utils/taskGroups';
import { useMediaQuery } from './useMediaQuery';

const USER_EMAIL_KEY = 'woodworks_user_email';

const avatarKey = (email: string) => `woodworks_avatar:${email.toLowerCase()}`;

// Fallback for people who were already logged in before this key existed.
// Only works if your token is a JWT that carries the email in "email" or "sub".
function emailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    const value = payload.email ?? payload.sub;
    return typeof value === 'string' && value.includes('@') ? value : null;
  } catch {
    return null;
  }
}

export function useAppController() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    () =>
      localStorage.getItem(USER_EMAIL_KEY) ||
      sessionStorage.getItem(USER_EMAIL_KEY) ||
      emailFromToken(token),
  );

  const [avatarId, setAvatarId] = useState<string | null>(() =>
    userEmail ? localStorage.getItem(avatarKey(userEmail)) : null,
  );

  useEffect(() => {
    setAvatarId(userEmail ? localStorage.getItem(avatarKey(userEmail)) : null);
  }, [userEmail]);

  const changeAvatar = async (id: string | null) => {
    setAvatarId(id);
    if (!userEmail) return;

    if (id) {
      localStorage.setItem(avatarKey(userEmail), id);
    } else {
      localStorage.removeItem(avatarKey(userEmail));
    }

    if (!isDemoMode && token) {
      try {
        await fetch(`${BASE_URL.replace(/\/$/, '')}/api/auth/update-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: userEmail, avatar: id }),
        });
      } catch (err) {
        console.warn('Could not sync avatar change to backend.', err);
      }
    }
  };

  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const [emailInput, setEmailInput] = useState(
    () => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const cached = localStorage.getItem(TASKS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [groups, setGroups] = useState<TaskGroup[]>(() =>
    loadJSON<TaskGroup[]>(GROUPS_KEY, []),
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<TaskGroup | null>(null);

  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newAccountPasswordInput, setNewAccountPasswordInput] = useState('');
  const [confirmAccountPasswordInput, setConfirmAccountPasswordInput] =
    useState('');
  const [showAccountPasswords, setShowAccountPasswords] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] =
    useState(false);
  const [deleteAccountPhrase, setDeleteAccountPhrase] = useState('');

  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilterPinned, setQuickFilterPinned] = useState(false);
  const [quickFilterUrgent, setQuickFilterUrgent] = useState(false);
  const [quickFilterHasDesc, setQuickFilterHasDesc] = useState(false);
  const [quickFilterHideDone, setQuickFilterHideDone] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [loading, setLoading] = useState<boolean>(tasks.length === 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>({
    id: null,
    title: '',
    description: '',
    completed: false,
    pinned: false,
    urgent: false,
    groupId: null,
  });
  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyTitle, setDailyTitle] = useState('');
  const [today, setToday] = useState(getTodayKey());

  const [activities, setActivities] = useState<
    Array<{ id: number; text: string; time: string }>
  >(() => {
    try {
      const cached = localStorage.getItem('woodworks_activities');
      return cached
        ? JSON.parse(cached)
        : [
            {
              id: 1,
              text: 'Initialized WoodWorks session',
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('woodworks_activities', JSON.stringify(activities));
  }, [activities]);

  const logActivity = (text: string) => {
    const newActivity = {
      id: Date.now(),
      text,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
  };

  const [mobilePanel, setMobilePanel] = useState<'tasks' | 'daily'>('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (token) {
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(true);
    }
  }, [token]);

  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const hasRoomForBothCardsWithChat = useMediaQuery('(min-width: 1440px)');
  const hasRoomForBothCardsWithRail = useMediaQuery('(min-width: 1240px)');
  const showToast = (message: string, type: Toast['type'] = 'success') =>
    setToast({ message, type });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  const saveGroupAssignment = (
    taskId: number | null,
    groupId: string | null | undefined,
  ) => {
    if (taskId === null) return;
    const assignments = loadJSON<Record<string, string>>(
      TASK_GROUP_ASSIGNMENTS_KEY,
      {},
    );
    if (groupId) assignments[String(taskId)] = groupId;
    else delete assignments[String(taskId)];
    localStorage.setItem(
      TASK_GROUP_ASSIGNMENTS_KEY,
      JSON.stringify(assignments),
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = groupNameInput.trim();
    if (!name) return;
    if (
      groups.some((group) => group.name.toLowerCase() === name.toLowerCase())
    ) {
      showToast('A group with that name already exists.', 'error');
      return;
    }

    if (isDemoMode) {
      const newGroup = { id: `group_${Date.now()}`, name };
      setGroups((previous) => [...previous, newGroup]);
      setSelectedGroupId(newGroup.id);
      setFilter('ALL');
      setMobilePanel('tasks');
      setGroupNameInput('');
      setIsGroupModalOpen(false);
      showToast(`Group “${name}” created (Demo Mode)`);
      logActivity(`Created group "${name}"`);
      return;
    }

    try {
      const newGroup = await createGroupApi(token!, name);
      setGroups((previous) => [...previous, newGroup]);
      setSelectedGroupId(newGroup.id);
      setFilter('ALL');
      setMobilePanel('tasks');
      setGroupNameInput('');
      setIsGroupModalOpen(false);
      showToast(`Group “${name}” created`);
      logActivity(`Created group "${name}"`);
    } catch (err) {
      showToast("Couldn't create the group. Try again.", 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string | number) => {
    if (isDemoMode) {
      setGroups(groups.filter((g) => g.id !== groupId));
      // Unassign tasks locally in demo mode
      setTasks(
        tasks.map((t) =>
          String(t.groupId) === String(groupId)
            ? { ...t, groupId: null, groupName: null }
            : t,
        ),
      );
      setSelectedGroupId(null);
      showToast('Group deleted. Tasks moved to "No group".', 'deletion');
      return;
    }

    try {
      await deleteGroupApi(token!, Number(groupId));
      setGroups((prev) => prev.filter((g) => String(g.id) !== String(groupId)));
      setSelectedGroupId(null);
      fetchTasks(true);
      showToast('Group deleted. Tasks moved to "No group".', 'deletion');
      logActivity('Deleted a task group');
    } catch (err) {
      showToast("Couldn't delete the group. Try again.", 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !currentPasswordInput ||
      !newAccountPasswordInput ||
      !confirmAccountPasswordInput
    ) {
      showToast('Complete all password fields first.', 'error');
      return;
    }
    if (newAccountPasswordInput.length < 8) {
      showToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newAccountPasswordInput !== confirmAccountPasswordInput) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (isDemoMode) {
      setCurrentPasswordInput('');
      setNewAccountPasswordInput('');
      setConfirmAccountPasswordInput('');
      showToast('Password changed (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL.replace(/\/$/, '')}/api/users/password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: currentPasswordInput,
            newPassword: newAccountPasswordInput,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to change password');

      setCurrentPasswordInput('');
      setNewAccountPasswordInput('');
      setConfirmAccountPasswordInput('');
      setIsAccountManagerOpen(false);
      showToast('Password updated successfully');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountPhrase !== 'DELETE') return;

    if (isDemoMode) {
      setIsDeleteAccountConfirmOpen(false);
      setIsAccountManagerOpen(false);
      setDeleteAccountPhrase('');
      clearSession();
      showToast('Account deleted (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL.replace(/\/$/, '')}/api/users/me`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok)
        throw new Error(data.error || 'Failed to delete account');

      setIsDeleteAccountConfirmOpen(false);
      setIsAccountManagerOpen(false);
      setDeleteAccountPhrase('');
      clearSession(); // Clears token, tasks, and resets auth state
      showToast('Your account has been deleted.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const switchAuthView = (view: 'login' | 'register') => {
    setAuthView(view);
    setAuthError(null);
    setPasswordInput('');
    setConfirmPasswordInput('');
    setShowPassword(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading) return;
    setAuthError(null);

    if (authView === 'register' && passwordInput !== confirmPasswordInput) {
      setAuthError("Passwords don't match. Please re-enter them.");
      return;
    }

    const endpoint =
      authView === 'login' ? '/api/auth/login' : '/api/auth/register';
    setIsAuthLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL.replace(/\/$/, '')}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.trim(),
            password: passwordInput,
          }),
        },
      );

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        throw new Error(
          data.error || 'Authentication failed. Please try again.',
        );
      }

      const persist = authView === 'register' || rememberMe;
      (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, data.token);
      (persist ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
      (persist ? localStorage : sessionStorage).setItem(
        USER_EMAIL_KEY,
        emailInput.trim(),
      );
      (persist ? sessionStorage : localStorage).removeItem(USER_EMAIL_KEY);

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, emailInput.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      // Save the avatar returned from the backend login response into localStorage
      if (data.avatar) {
        localStorage.setItem(avatarKey(emailInput.trim()), data.avatar);
        setAvatarId(data.avatar);
      } else {
        localStorage.removeItem(avatarKey(emailInput.trim()));
        setAvatarId(null);
      }

      setToken(data.token);
      setUserEmail(emailInput.trim());
      setPasswordInput('');
      setConfirmPasswordInput('');
      setShowPassword(false);
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(true);
      showToast(
        authView === 'login'
          ? 'Logged in successfully'
          : 'Account created successfully',
      );
    } catch (err: any) {
      if (err instanceof TypeError) {
        setAuthError(
          "Couldn't reach the server. Check your connection and try again.",
        );
      } else {
        setAuthError(err.message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    sessionStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(TASKS_CACHE_KEY);
    setToken(null);
    setUserEmail(null);
    setTasks([]);
    setDailyTasks([]);
    setSelectedGroupId(null);
    setActiveTaskId(null);
    setIsSidebarOpen(false);
    setIsSidebarCollapsed(true);
  };

  const handleLogout = () => {
    clearSession();
    showToast('Logged out');
  };

  useEffect(() => {
    if (isDemoMode || token) {
      fetchTasks();
      fetchDailyTasks();
      if (!isDemoMode && token) {
        fetchGroupsApi(token)
          .then((data) => setGroups(data))
          .catch((err) =>
            console.warn('Could not fetch groups from backend.', err),
          );
      }
    }
  }, [token]);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    const timer = setInterval(() => setToday(getTodayKey()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTasks = async (
    isBackground = false,
    pendingGroupAssignment?: {
      title: string;
      groupId: string | null;
      previousTaskIds: Array<number | null>;
    },
  ) => {
    if (!isBackground && tasks.length === 0) {
      setLoading(true);
    }

    if (isDemoMode) {
      setTimeout(() => {
        const mockTasks = [
          {
            id: 1,
            title: 'Review Q4 Cloud Architecture',
            description: 'Analyze GCP Cloud Run scaling parameters',
            completed: true,
            pinned: false,
            urgent: false,
          },
          {
            id: 2,
            title: 'Implement Sidebar Features',
            description: 'Draft each design of the feature',
            completed: false,
            pinned: true,
            urgent: false,
          },
          {
            id: 3,
            title: 'Optimize PostgreSQL Queries',
            description: 'Review Neon connection pooler performance',
            completed: false,
            pinned: false,
            urgent: true,
          },
        ];
        setTasks(
          mergeLocalGroupAssignments(mockTasks, TASK_GROUP_ASSIGNMENTS_KEY),
        );
        setIsBackendOnline(true);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        clearSession();
        showToast('Your session expired. Please sign in again.', 'error');
        return;
      }

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      // Map task.groupName to task.groupId using the current groups list
      const mappedData = data.map((task: any) => {
        const matchedGroup = groups.find((g) => g.name === task.groupName);
        return {
          ...task,
          groupId: matchedGroup ? matchedGroup.id : task.groupId || null,
        };
      });
      let hydratedTasks = mergeLocalGroupAssignments(
        mappedData,
        TASK_GROUP_ASSIGNMENTS_KEY,
      );
      if (pendingGroupAssignment) {
        const newlyCreatedMatch = hydratedTasks
          .filter(
            (task) =>
              task.title === pendingGroupAssignment.title &&
              !pendingGroupAssignment.previousTaskIds.includes(task.id),
          )
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
        if (
          newlyCreatedMatch?.id !== null &&
          newlyCreatedMatch?.id !== undefined
        ) {
          saveGroupAssignment(
            newlyCreatedMatch.id,
            pendingGroupAssignment.groupId,
          );
          hydratedTasks = hydratedTasks.map((task) =>
            task.id === newlyCreatedMatch.id
              ? { ...task, groupId: pendingGroupAssignment.groupId }
              : task,
          );
        }
      }
      setTasks(hydratedTasks);
      setIsBackendOnline(true);
    } catch (error) {
      setIsBackendOnline(false);
      if (tasks.length === 0) {
        setTasks(
          mergeLocalGroupAssignments(
            [
              {
                id: 1,
                title: 'Configure PostgreSQL Container',
                description: 'Docker compose setup complete',
                completed: true,
                pinned: false,
                urgent: false,
              },
              {
                id: 2,
                title: 'Build Spring Boot REST API',
                description: 'Implement controllers, services, and DTOs',
                completed: true,
                pinned: false,
                urgent: false,
              },
              {
                id: 3,
                title: 'Connect React Frontend',
                description: 'Wire up UI with Tailwind CSS',
                completed: false,
                pinned: false,
                urgent: false,
              },
            ],
            TASK_GROUP_ASSIGNMENTS_KEY,
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyTasks = async () => {
    if (isDemoMode) {
      const saved = loadJSON<unknown>(DAILY_KEY, []);
      setDailyTasks(Array.isArray(saved) ? saved : []);
      return;
    }

    try {
      const response = await fetch(DAILY_API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDailyTasks(data);
      }
    } catch (err) {
      console.warn('Could not fetch daily tasks from backend.');
    }
  };

  const handleAddDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = dailyTitle.trim();
    if (!title) return;

    if (isDemoMode) {
      const updated = [
        ...dailyTasks,
        { id: Date.now(), title, lastCompleted: null },
      ];
      setDailyTasks(updated);
      localStorage.setItem(DAILY_KEY, JSON.stringify(updated));
      setDailyTitle('');
      showToast('Daily task added (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(DAILY_API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, lastCompleted: null }),
      });

      if (response.ok) {
        setDailyTitle('');
        fetchDailyTasks();
        showToast('Daily task added');
      } else {
        showToast("Couldn't add daily task.", 'error');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const toggleDaily = async (daily: DailyTask) => {
    const newLastCompleted = daily.lastCompleted === today ? null : today;
    const updatedTask = { ...daily, lastCompleted: newLastCompleted };

    if (isDemoMode) {
      const updatedList = dailyTasks.map((d) =>
        d.id === daily.id ? updatedTask : d,
      );
      setDailyTasks(updatedList);
      localStorage.setItem(DAILY_KEY, JSON.stringify(updatedList));
      return;
    }

    try {
      const response = await fetch(`${DAILY_API_BASE_URL}/${daily.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        setDailyTasks((prev) =>
          prev.map((d) => (d.id === daily.id ? updatedTask : d)),
        );
      } else {
        showToast("Couldn't update daily task.", 'error');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const deleteDaily = async (id: number) => {
    if (isDemoMode) {
      const updatedList = dailyTasks.filter((d) => d.id !== id);
      setDailyTasks(updatedList);
      localStorage.setItem(DAILY_KEY, JSON.stringify(updatedList));
      showToast('Daily task removed (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(`${DAILY_API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setDailyTasks((prev) => prev.filter((d) => d.id !== id));
        showToast('Daily task removed');
      } else {
        showToast("Couldn't delete daily task.", 'error');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask.title.trim() || isSaving) return;

    if (isDemoMode) {
      if (isEditing) {
        setTasks(tasks.map((t) => (t.id === currentTask.id ? currentTask : t)));
        saveGroupAssignment(currentTask.id, currentTask.groupId);
      } else {
        setTasks([
          ...tasks,
          {
            ...currentTask,
            id: Date.now(),
            groupId: currentTask.groupId ?? null,
          },
        ]);
      }
      closeModal();
      showToast(
        isEditing ? 'Task updated (Demo Mode)' : 'Task created (Demo Mode)',
      );
      return;
    }

    if (isBackendOnline) {
      setIsSaving(true);
      try {
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing
          ? `${API_BASE_URL}/${currentTask.id}`
          : API_BASE_URL;

        const matchedGroup = groups.find(
          (g) => String(g.id) === String(currentTask.groupId),
        );
        const groupNameValue = matchedGroup ? matchedGroup.name : null;

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: currentTask.title,
            description: currentTask.description,
            completed: currentTask.completed,
            pinned: currentTask.pinned ?? false,
            urgent: currentTask.urgent ?? false,
            groupName: groupNameValue,
          }),
        });

        if (response.ok) {
          let savedTask: any = null;
          try {
            savedTask = await response.clone().json();
          } catch {}
          const returnedId = isEditing
            ? currentTask.id
            : (savedTask?.id ??
              savedTask?.task?.id ??
              savedTask?.data?.id ??
              null);
          if (
            returnedId !== null &&
            returnedId !== undefined &&
            Number.isFinite(Number(returnedId))
          ) {
            saveGroupAssignment(Number(returnedId), currentTask.groupId);
          }
          fetchTasks(
            true,
            !isEditing
              ? {
                  title: currentTask.title,
                  groupId: currentTask.groupId ?? null,
                  previousTaskIds: tasks.map((task) => task.id),
                }
              : undefined,
          );
          closeModal();
          showToast(isEditing ? 'Task updated' : 'Task created');
        } else {
          showToast("Couldn't save the task. Try again.", 'error');
        }
      } catch (err) {
        showToast(
          "Couldn't reach the server. Your task wasn't saved.",
          'error',
        );
      } finally {
        setIsSaving(false);
      }
    } else {
      if (isEditing) {
        setTasks(tasks.map((t) => (t.id === currentTask.id ? currentTask : t)));
        saveGroupAssignment(currentTask.id, currentTask.groupId);
      } else {
        setTasks([
          ...tasks,
          {
            ...currentTask,
            id: Date.now(),
            groupId: currentTask.groupId ?? null,
          },
        ]);
      }
      closeModal();
      showToast(isEditing ? 'Task updated' : 'Task created');
      logActivity(
        isEditing
          ? `Updated task "${currentTask.title}"`
          : `Created task "${currentTask.title}"`,
      );
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    if (isDemoMode) {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          title,
          description: '',
          completed: false,
          pinned: false,
          urgent: false,
          groupId: selectedGroupId,
        },
      ]);
      setQuickTitle('');
      showToast('Task created (Demo Mode)');
      return;
    }

    if (isBackendOnline) {
      try {
        const activeGroup = groups.find(
          (g) => String(g.id) === String(selectedGroupId),
        );
        const groupNameValue = activeGroup ? activeGroup.name : null;

        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description: '',
            completed: false,
            pinned: false,
            urgent: false,
            groupName: groupNameValue,
          }),
        });
        if (response.ok) {
          let savedTask: any = null;
          try {
            savedTask = await response.clone().json();
          } catch {}
          const returnedId =
            savedTask?.id ?? savedTask?.task?.id ?? savedTask?.data?.id ?? null;
          if (
            returnedId !== null &&
            returnedId !== undefined &&
            Number.isFinite(Number(returnedId))
          ) {
            saveGroupAssignment(Number(returnedId), selectedGroupId);
          }
          setQuickTitle('');
          fetchTasks(true, {
            title,
            groupId: selectedGroupId,
            previousTaskIds: tasks.map((task) => task.id),
          });
          showToast('Task created');
          logActivity(`Quick-added task "${title}"`);
        } else {
          showToast("Couldn't create the task. Try again.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach the server.", 'error');
      }
    } else {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          title,
          description: '',
          completed: false,
          pinned: false,
          urgent: false,
          groupId: selectedGroupId,
        },
      ]);
      setQuickTitle('');
      showToast('Task created');
    }
  };

  const handleDeleteTask = async (id: number | null) => {
    if (isDemoMode) {
      setTasks(tasks.filter((t) => t.id !== id));
      saveGroupAssignment(id, null);
      showToast('Task deleted (Demo Mode)', 'deletion');
      return;
    }

    if (isBackendOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setTasks(tasks.filter((t) => t.id !== id));
          saveGroupAssignment(id, null);
          showToast('Task deleted', 'deletion');
          logActivity('Deleted task');
        } else {
          showToast("Couldn't delete the task. Try again.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach the server.", 'error');
      }
    }
  };

  const toggleComplete = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };

    showToast(
      updated.completed
        ? `Completed "${task.title}"`
        : `Marked "${task.title}" as to do`,
      updated.completed ? 'completion' : 'info',
    );

    if (isDemoMode) {
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
      return;
    }

    if (isBackendOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updated),
        });
        if (response.ok) {
          setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
        } else {
          showToast("Couldn't update the status. Try again.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach the server.", 'error');
      }
    } else {
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    }
    logActivity(
      updated.completed
        ? `Completed task "${task.title}"`
        : `Marked task "${task.title}" as to do`,
    );
  };

  const toggleUrgent = async (task: Task) => {
    const updated = { ...task, urgent: !task.urgent };
    if (isDemoMode) {
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
      showToast(updated.urgent ? 'Marked as urgent' : 'Urgent tag removed');
      logActivity(
        updated.urgent
          ? `Marked task "${task.title}" as urgent`
          : `Removed urgent tag from task "${task.title}"`,
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
        showToast(updated.urgent ? 'Marked as urgent' : 'Urgent tag removed');
        logActivity(
          updated.urgent
            ? `Marked task "${task.title}" as urgent`
            : `Removed urgent tag from task "${task.title}"`,
        );
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const togglePinned = async (task: Task) => {
    const updated = { ...task, pinned: !task.pinned };
    if (isDemoMode) {
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
      showToast(updated.pinned ? 'Task pinned to top' : 'Pin removed');
      logActivity(
        updated.pinned
          ? `Pinned task "${task.title}"`
          : `Unpinned task "${task.title}"`,
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (response.ok) {
        setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
        showToast(updated.pinned ? 'Task pinned to top' : 'Pin removed');
        logActivity(
          updated.pinned
            ? `Pinned task "${task.title}"`
            : `Unpinned task "${task.title}"`,
        );
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const updateTaskBackend = async (task: Task) => {
    if (isDemoMode) {
      showToast('Task updated (Demo Mode)');
      return;
    }

    try {
      const matchedGroup = groups.find(
        (g) => String(g.id) === String(task.groupId),
      );
      const groupNameValue = matchedGroup ? matchedGroup.name : null;

      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          completed: task.completed,
          pinned: task.pinned ?? false,
          urgent: task.urgent ?? false,
          groupName: groupNameValue,
        }),
      });

      if (response.ok) {
        showToast('Task updated');
        logActivity(`Updated task "${task.title}"`);
      } else {
        showToast("Couldn't save changes to database.", 'error');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const moveTaskToGroup = async (task: Task, newGroupId: string | null) => {
    const updated = { ...task, groupId: newGroupId };

    const targetGroup = groups.find((g) => String(g.id) === String(newGroupId));
    const groupNameValue = targetGroup ? targetGroup.name : null;

    showToast(
      `Moved "${task.title}" to ${targetGroup ? targetGroup.name : 'No group'}`,
    );

    if (isDemoMode) {
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...updated, groupName: groupNameValue } : t,
        ),
      );
      saveGroupAssignment(task.id, newGroupId);
      return;
    }

    if (isBackendOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            completed: task.completed,
            pinned: task.pinned ?? false,
            urgent: task.urgent ?? false,
            groupName: groupNameValue,
          }),
        });
        if (response.ok) {
          saveGroupAssignment(task.id, newGroupId);
          setTasks(
            tasks.map((t) =>
              t.id === task.id ? { ...updated, groupName: groupNameValue } : t,
            ),
          );
        } else {
          showToast("Couldn't move task group. Try again.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach the server.", 'error');
      }
    } else {
      setTasks(
        tasks.map((t) =>
          t.id === task.id ? { ...updated, groupName: groupNameValue } : t,
        ),
      );
      saveGroupAssignment(task.id, newGroupId);
    }
    logActivity(`Moved task "${task.title}" to group`);
  };

  const openCreateModal = () => {
    setCurrentTask({
      id: null,
      title: '',
      description: '',
      completed: false,
      pinned: false,
      urgent: false,
      groupId: selectedGroupId,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask({
      id: null,
      title: '',
      description: '',
      completed: false,
      pinned: false,
      urgent: false,
      groupId: null,
    });
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;
    setTaskToDelete(null);
    await handleDeleteTask(id);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isDeleteAccountConfirmOpen) setIsDeleteAccountConfirmOpen(false);
      else if (taskToDelete) setTaskToDelete(null);
      else if (isModalOpen) closeModal();
      else if (isGroupModalOpen) setIsGroupModalOpen(false);
      else if (isAccountManagerOpen) setIsAccountManagerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isModalOpen,
    taskToDelete,
    isLargeScreen,
    isGroupModalOpen,
    isAccountManagerOpen,
    isDeleteAccountConfirmOpen,
  ]);

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Find the currently selected group object to compare names if needed
      const selectedGroup = groups.find(
        (g) => String(g.id) === String(selectedGroupId),
      );
      const matchesGroup =
        !selectedGroupId ||
        String(task.groupId) === String(selectedGroupId) ||
        (selectedGroup && task.groupName === selectedGroup.name);

      if (!matchesSearch || !matchesGroup) return false;
      if (filter === 'PENDING') return !task.completed;
      if (filter === 'COMPLETED') return task.completed;
      if (filter === 'URGENT') return !task.completed && task.urgent;

      if (quickFilterPinned && !task.pinned) return false;
      if (quickFilterUrgent && !task.urgent) return false;
      if (quickFilterHasDesc && (!task.description || !task.description.trim()))
        return false;
      if (quickFilterHideDone && task.completed) return false;

      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (!a.completed) {
        const pinnedA = !!a.pinned;
        const pinnedB = !!b.pinned;
        if (pinnedA !== pinnedB) return pinnedA ? -1 : 1;

        const urgentA = !!a.urgent;
        const urgentB = !!b.urgent;
        if (urgentA !== urgentB) return urgentA ? -1 : 1;
      }
      const idA = a.id || 0;
      const idB = b.id || 0;
      if (sortOrder === 'newest') {
        return idB - idA;
      } else {
        return idA - idB;
      }
    });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const urgentCount = tasks.filter((t) => !t.completed && t.urgent).length;

  const taskKeys = new Map<number | null, number>(
    [...tasks]
      .sort((a, b) => (a.id || 0) - (b.id || 0))
      .map((t, i) => [t.id, i + 1] as [number | null, number]),
  );
  const getTaskKey = (task: Task) => `WW-${taskKeys.get(task.id) ?? '?'}`;

  const navItems = [
    { key: 'ALL', label: 'All tasks', icon: ListTodo, count: tasks.length },
    { key: 'PENDING', label: 'To do', icon: Clock, count: pendingCount },
    { key: 'URGENT', label: 'Urgent', icon: Flag, count: urgentCount },
    {
      key: 'COMPLETED',
      label: 'Done',
      icon: CheckSquare,
      count: completedCount,
    },
  ];

  const filterTitle = selectedGroupId
    ? (groups.find((group) => group.id === selectedGroupId)?.name ??
      'Group tasks')
    : (navItems.find((n) => n.key === filter)?.label ?? 'All tasks');
  const isFirstLoad = loading && tasks.length === 0;

  const dailyDoneCount = dailyTasks.filter(
    (d) => d.lastCompleted === today,
  ).length;
  const allDailyDone =
    dailyTasks.length > 0 && dailyDoneCount === dailyTasks.length;
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isSidebarColumnOpen = isLargeScreen || isSidebarOpen;
  const cardsSideBySide = isSidebarColumnOpen
    ? hasRoomForBothCardsWithChat
    : hasRoomForBothCardsWithRail;

  const authInputClass =
    'w-full h-11 bg-surface border-2 border-line hover:bg-subtle rounded px-3 text-sm placeholder-fg-3 focus:outline-none focus:border-fg focus:bg-surface';

  const isAuthScreen = !isDemoMode && !token;
  const toastPosition = isAuthScreen
    ? 'top-4 right-4'
    : isDemoMode
      ? `top-[6.4rem] left-4 md:left-[17rem] ${isSidebarColumnOpen ? (isSidebarCollapsed ? 'lg:right-[5rem]' : 'lg:right-[21.5rem]') + ' lg:left-auto' : 'lg:right-[5rem] lg:left-auto'}`
      : `top-[4.25rem] left-4 md:left-[17rem] ${isSidebarColumnOpen ? (isSidebarCollapsed ? 'lg:right-[5rem]' : 'lg:right-[21.5rem]') + ' lg:left-auto' : 'lg:right-[5rem] lg:left-auto'}`;

  return {
    isDemoMode,
    userEmail,
    avatarId,
    changeAvatar,
    token,
    setToken,
    authView,
    setAuthView,
    emailInput,
    setEmailInput,
    passwordInput,
    setPasswordInput,
    authError,
    setAuthError,
    confirmPasswordInput,
    setConfirmPasswordInput,
    showPassword,
    setShowPassword,
    isAuthLoading,
    setIsAuthLoading,
    rememberMe,
    setRememberMe,
    tasks,
    setTasks,
    groups,
    setGroups,
    selectedGroupId,
    setSelectedGroupId,
    isGroupModalOpen,
    setIsGroupModalOpen,
    groupNameInput,
    setGroupNameInput,
    isAccountManagerOpen,
    setIsAccountManagerOpen,
    currentPasswordInput,
    setCurrentPasswordInput,
    newAccountPasswordInput,
    setNewAccountPasswordInput,
    confirmAccountPasswordInput,
    setConfirmAccountPasswordInput,
    showAccountPasswords,
    setShowAccountPasswords,
    isDeleteAccountConfirmOpen,
    setIsDeleteAccountConfirmOpen,
    deleteAccountPhrase,
    setDeleteAccountPhrase,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isBackendOnline,
    setIsBackendOnline,
    loading,
    setLoading,
    isModalOpen,
    setIsModalOpen,
    currentTask,
    setCurrentTask,
    isEditing,
    setIsEditing,
    isSaving,
    setIsSaving,
    quickTitle,
    setQuickTitle,
    taskToDelete,
    setTaskToDelete,
    toast,
    setToast,
    dailyTasks,
    setDailyTasks,
    dailyTitle,
    setDailyTitle,
    today,
    setToday,
    mobilePanel,
    setMobilePanel,
    isLargeScreen,
    hasRoomForBothCardsWithChat,
    hasRoomForBothCardsWithRail,
    showToast,
    sortOrder,
    setSortOrder,
    saveGroupAssignment,
    handleCreateGroup,
    handleDeleteGroup,
    groupToDelete,
    setGroupToDelete,
    handleChangePassword,
    handleDeleteAccount,
    switchAuthView,
    handleAuthSubmit,
    clearSession,
    handleLogout,
    fetchTasks,
    fetchDailyTasks,
    handleAddDaily,
    toggleDaily,
    deleteDaily,
    handleSaveTask,
    handleQuickAdd,
    handleDeleteTask,
    toggleComplete,
    toggleUrgent,
    togglePinned,
    openCreateModal,
    openEditModal,
    closeModal,
    confirmDelete,
    filteredTasks,
    completedCount,
    pendingCount,
    urgentCount,
    taskKeys,
    getTaskKey,
    navItems,
    filterTitle,
    isFirstLoad,
    dailyDoneCount,
    allDailyDone,
    todayLabel,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    cardsSideBySide,
    authInputClass,
    isAuthScreen,
    toastPosition,
    activeTaskId,
    setActiveTaskId,
    activeTask,
    updateTaskBackend,
    quickFilterPinned,
    setQuickFilterPinned,
    quickFilterUrgent,
    setQuickFilterUrgent,
    quickFilterHasDesc,
    setQuickFilterHasDesc,
    quickFilterHideDone,
    setQuickFilterHideDone,
    activities,
    logActivity,
  };
}

export type AppController = ReturnType<typeof useAppController>;
