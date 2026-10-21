import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, Plus, Trash2, Pencil, Search,
  RefreshCw, ListTodo, CheckSquare, Clock, X, AlertTriangle, SquareCheckBig,
  Eye, EyeOff, LogOut, Flag, Repeat, Pin
} from 'lucide-react';

const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || (import.meta as any).env.VITE_DEMO_MODE === 'true';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'https://woodworks-backend-75805996486.asia-southeast1.run.app';
const API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/tasks`;
const DAILY_API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/daily-tasks`;

const TOKEN_KEY = 'woodworks_token';
const TASKS_CACHE_KEY = 'woodworks_tasks_cache';
const REMEMBERED_EMAIL_KEY = 'woodworks_remembered_email';
const DAILY_KEY = isDemoMode ? 'woodworks_demo_daily_tasks' : 'woodworks_daily_tasks';

interface Task {
  id: number | null;
  title: string;
  description: string;
  completed: boolean;
  pinned?: boolean;
  urgent?: boolean;
}

interface DailyTask {
  id: number;
  title: string;
  lastCompleted: string | null;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  );
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [emailInput, setEmailInput] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '');
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

  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [loading, setLoading] = useState<boolean>(tasks.length === 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>({ id: null, title: '', description: '', completed: false, pinned: false, urgent: false });
  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyTitle, setDailyTitle] = useState('');
  const [today, setToday] = useState(getTodayKey());

  const [mobilePanel, setMobilePanel] = useState<'tasks' | 'daily'>('tasks');
  const showToast = (message: string, type: Toast['type'] = 'success') => setToast({ message, type });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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

    const endpoint = authView === 'login' ? '/api/auth/login' : '/api/auth/register';
    setIsAuthLoading(true);

    try {
      const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), password: passwordInput })
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      const persist = authView === 'register' || rememberMe;
      (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, data.token);

      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, emailInput.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      setToken(data.token);
      setPasswordInput('');
      setConfirmPasswordInput('');
      setShowPassword(false);
      showToast(authView === 'login' ? 'Logged in successfully' : 'Account created successfully');
    } catch (err: any) {
      setAuthError(err.message || "Couldn't reach the server.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TASKS_CACHE_KEY);
    setToken(null);
    setTasks([]);
    setDailyTasks([]);
  };

  const handleLogout = () => {
    clearSession();
    showToast('Logged out');
  };

  useEffect(() => {
    if (isDemoMode || token) {
      fetchTasks();
      fetchDailyTasks();
    }
  }, [token]);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    const timer = setInterval(() => setToday(getTodayKey()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTasks = async (isBackground = false) => {
    if (!isBackground && tasks.length === 0) {
      setLoading(true);
    }

    if (isDemoMode) {
      setTimeout(() => {
        setTasks([
          { id: 1, title: 'Review Q4 Cloud Architecture', description: 'Analyze GCP Cloud Run scaling parameters', completed: true, pinned: false, urgent: false },
          { id: 2, title: 'Implement AI Task Assistant', description: 'Draft natural language CRUD prompt handlers', completed: false, pinned: true, urgent: false },
          { id: 3, title: 'Optimize PostgreSQL Queries', description: 'Review Neon connection pooler performance', completed: false, pinned: false, urgent: true }
        ]);
        setIsBackendOnline(true);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        clearSession();
        showToast('Your session expired. Please sign in again.', 'error');
        return;
      }

      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      setTasks(data);
      setIsBackendOnline(true);
    } catch (error) {
      setIsBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyTasks = async () => {
    if (isDemoMode) {
      setDailyTasks(loadJSON<DailyTask[]>(DAILY_KEY, []));
      return;
    }
    try {
      const response = await fetch(DAILY_API_BASE_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDailyTasks(await response.json());
      }
    } catch (err) {}
  };

  const handleAddDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = dailyTitle.trim();
    if (!title) return;

    if (isDemoMode) {
      const updated = [...dailyTasks, { id: Date.now(), title, lastCompleted: null }];
      setDailyTasks(updated);
      localStorage.setItem(DAILY_KEY, JSON.stringify(updated));
      setDailyTitle('');
      return;
    }

    try {
      const response = await fetch(DAILY_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, lastCompleted: null })
      });
      if (response.ok) {
        setDailyTitle('');
        fetchDailyTasks();
      }
    } catch (err) {}
  };

  const toggleDaily = async (daily: DailyTask) => {
    const updatedTask = { ...daily, lastCompleted: daily.lastCompleted === today ? null : today };
    if (isDemoMode) {
      setDailyTasks(dailyTasks.map(d => d.id === daily.id ? updatedTask : d));
      return;
    }
    try {
      const response = await fetch(`${DAILY_API_BASE_URL}/${daily.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedTask)
      });
      if (response.ok) {
        setDailyTasks(prev => prev.map(d => d.id === daily.id ? updatedTask : d));
      }
    } catch (err) {}
  };

  const deleteDaily = async (id: number) => {
    if (isDemoMode) {
      setDailyTasks(dailyTasks.filter(d => d.id !== id));
      return;
    }
    try {
      const response = await fetch(`${DAILY_API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setDailyTasks(prev => prev.filter(d => d.id !== id));
    } catch (err) {}
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask.title.trim() || isSaving) return;

    if (isDemoMode) {
      if (isEditing) {
        setTasks(tasks.map(t => t.id === currentTask.id ? currentTask : t));
      } else {
        setTasks([...tasks, { ...currentTask, id: Date.now() }]);
      }
      closeModal();
      showToast(isEditing ? 'Task updated' : 'Task created');
      return;
    }

    if (isBackendOnline) {
      setIsSaving(true);
      try {
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_BASE_URL}/${currentTask.id}` : API_BASE_URL;

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title: currentTask.title,
            description: currentTask.description,
            completed: currentTask.completed,
            pinned: currentTask.pinned,
            urgent: currentTask.urgent
          })
        });

        if (response.ok) {
          fetchTasks(true);
          closeModal();
          showToast(isEditing ? 'Task updated' : 'Task created');
        } else {
          showToast("Couldn't save the task.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach server.", 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    if (isDemoMode) {
      setTasks([...tasks, { id: Date.now(), title, description: '', completed: false, pinned: false, urgent: false }]);
      setQuickTitle('');
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description: '', completed: false, pinned: false, urgent: false })
      });
      if (response.ok) {
        setQuickTitle('');
        fetchTasks(true);
      }
    } catch (err) {}
  };

  const handleDeleteTask = async (id: number | null) => {
    if (isDemoMode) {
      setTasks(tasks.filter(t => t.id !== id));
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {}
  };

  const toggleComplete = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    if (isDemoMode) {
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated)
      });
      if (response.ok) setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (err) {}
  };

  const toggleUrgent = async (task: Task) => {
    const updated = { ...task, urgent: !task.urgent };
    if (isDemoMode) {
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
      showToast(updated.urgent ? 'Marked as urgent' : 'Urgent tag removed');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        setTasks(tasks.map(t => t.id === task.id ? updated : t));
        showToast(updated.urgent ? 'Marked as urgent' : 'Urgent tag removed');
      }
    } catch (err) {}
  };

  const togglePinned = async (task: Task) => {
    const updated = { ...task, pinned: !task.pinned };
    if (isDemoMode) {
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
      showToast(updated.pinned ? 'Task pinned to top' : 'Pin removed');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        setTasks(tasks.map(t => t.id === task.id ? updated : t));
        showToast(updated.pinned ? 'Task pinned to top' : 'Pin removed');
      }
    } catch (err) {}
  };

  const openCreateModal = () => {
    setCurrentTask({ id: null, title: '', description: '', completed: false, pinned: false, urgent: false });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;
    setTaskToDelete(null);
    await handleDeleteTask(id);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filter === 'PENDING') return matchesSearch && !task.completed;
    if (filter === 'COMPLETED') return matchesSearch && task.completed;
    if (filter === 'URGENT') return matchesSearch && !task.completed && task.urgent;
    return matchesSearch;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.completed) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    }
    return sortOrder === 'newest' ? (b.id || 0) - (a.id || 0) : (a.id || 0) - (b.id || 0);
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const urgentCount = tasks.filter(t => !t.completed && t.urgent).length;

  const taskKeys = new Map<number | null, number>(
    [...tasks].sort((a, b) => (a.id || 0) - (b.id || 0)).map((t, i) => [t.id, i + 1] as [number | null, number])
  );
  const getTaskKey = (task: Task) => `WW-${taskKeys.get(task.id) ?? '?'}`;

  const navItems = [
    { key: 'ALL', label: 'All tasks', icon: ListTodo, count: tasks.length },
    { key: 'PENDING', label: 'To do', icon: Clock, count: pendingCount },
    { key: 'URGENT', label: 'Urgent', icon: Flag, count: urgentCount },
    { key: 'COMPLETED', label: 'Done', icon: CheckSquare, count: completedCount },
  ];

  const filterTitle = navItems.find(n => n.key === filter)?.label ?? 'All tasks';
  const isFirstLoad = loading && tasks.length === 0;
  const dailyDoneCount = dailyTasks.filter(d => d.lastCompleted === today).length;
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const authInputClass = 'w-full h-11 bg-white border-2 border-[#DEE2E6] hover:bg-[#F8F9FA] rounded px-3 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529]';
  const isAuthScreen = !isDemoMode && !token;
  const toastPosition = isAuthScreen ? 'top-4' : isDemoMode ? 'top-[6.4rem]' : 'top-[4.25rem]';

  return (
    <>
      {isAuthScreen ? (
        <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
          <div className="hidden lg:flex flex-col justify-between bg-[#212529] text-white p-12">
            <div className="flex items-center gap-2.5">
              <img src="/WoodWorksLogo.png" alt="WoodWorks Logo" className="w-10 h-10 rounded-2xl object-contain shadow-sm" />
              <span className="font-semibold text-lg">WoodWorks</span>
            </div>
            <div className="max-w-md">
              <h2 className="text-3xl font-semibold leading-tight">Keep every task moving.<br />From <span className="text-[#BF5700] font-bold">to do</span>, to <span className="text-[#BF5700] font-bold">done</span>.</h2>
            </div>
            <p className="text-xs text-white/85">Personal Task Management System</p>
          </div>
          <div className="flex items-center justify-center px-6 py-12 bg-[#F8F9FA] lg:bg-white">
            <div className="w-full max-w-sm">
              <h1 className="text-2xl font-semibold text-[#212529]">{authView === 'login' ? 'Welcome back' : 'Create your account'}</h1>
              {authError && (
                <div role="alert" className="mt-5 flex items-start gap-2.5 p-3 bg-[#FFECEB] border border-[#C9372C33] text-[#AE2E24] text-sm rounded">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#495057] mb-1">Email</label>
                  <input type="email" required autoFocus value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="you@example.com" className={authInputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#495057] mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter password" className={`${authInputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(prev => !prev)} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded text-[#5C636A] hover:bg-[#2125290F] cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {authView === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#495057] mb-1">Confirm password</label>
                    <input type={showPassword ? 'text' : 'password'} required value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} placeholder="Re-enter password" className={authInputClass} />
                  </div>
                )}
                {authView === 'login' && (
                  <label className="flex items-center gap-2 w-fit text-sm text-[#495057] cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded-sm accent-[#212529] cursor-pointer" />
                    Remember me
                  </label>
                )}
                <button type="submit" disabled={isAuthLoading} className="w-full h-11 flex items-center justify-center gap-2 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50">
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isAuthLoading ? (authView === 'login' ? 'Signing in...' : 'Creating...') : (authView === 'login' ? 'Sign in' : 'Create account')}
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-[#5C636A]">
                {authView === 'login' ? (
                  <p>Don't have an account? <button onClick={() => switchAuthView('register')} className="text-[#212529] font-semibold hover:underline cursor-pointer">Sign up</button></p>
                ) : (
                  <p>Already have an account? <button onClick={() => switchAuthView('login')} className="text-[#212529] font-semibold hover:underline cursor-pointer">Sign in</button></p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-dvh flex flex-col overflow-hidden bg-[#F8F9FA] text-[#212529]">
          {isDemoMode && (
            <div className="shrink-0 bg-[#E9ECEF] border-b border-[#DEE2E6] px-4 py-2 text-xs text-[#212529] flex items-center justify-between gap-3 font-medium">
              <span>💡 <strong>Demo Mode:</strong> Sandbox active.</span>
              <a href="https://github.com/vnclrd/woodworks" target="_blank" rel="noreferrer" className="underline">View Source</a>
            </div>
          )}

          <header className="shrink-0 h-14 bg-white border-b border-[#DEE2E6] flex items-center gap-2 sm:gap-4 px-4 z-20">
            <div className="flex items-center gap-2.5 shrink-0 md:w-60">
              <img src="/WoodWorksLogo.png" alt="Logo" className="w-10 h-10 rounded-2xl object-contain shadow-sm" />
              <span className="hidden sm:inline font-semibold text-[15px]">WoodWorks</span>
            </div>
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C636A]" />
              <input type="text" placeholder="Search tasks" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 bg-white border-2 border-[#DEE2E6] hover:bg-[#F8F9FA] rounded pl-9 pr-9 text-sm focus:outline-none focus:border-[#212529]" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#5C636A]"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
              <button onClick={() => { fetchTasks(false); fetchDailyTasks(); }} title="Refresh" className="h-9 w-9 flex items-center justify-center rounded text-[#495057] hover:bg-[#2125290F]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
              <button onClick={openCreateModal} className="h-9 flex items-center gap-1.5 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Create</span></button>
              {!isDemoMode && <button onClick={handleLogout} title="Logout" className="h-9 px-3 flex items-center gap-1.5 text-xs font-medium text-[#495057] hover:bg-[#2125290F] rounded"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span></button>}
            </div>
          </header>

          <div className="flex flex-1 min-h-0">
            <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#212529] border-r border-white/10 p-3 overflow-y-auto">
              <div className="flex items-center gap-3 px-2 py-3 mb-2">
                <div className="w-9 h-9 rounded bg-white/10 text-white flex items-center justify-center"><SquareCheckBig className="w-5 h-5" /></div>
                <div className="min-w-0"><p className="text-sm font-semibold text-white truncate">WoodWorks Tasks</p><p className="text-xs text-white/60">Task management</p></div>
              </div>
              <nav className="space-y-0.5">
                {navItems.map(({ key, label, icon: Icon, count }) => (
                  <button key={key} onClick={() => { setFilter(key); setMobilePanel('tasks'); }} className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded text-sm transition-colors cursor-pointer ${filter === key ? 'bg-[#495057] text-white font-semibold' : 'text-white/70 hover:bg-[#495057] hover:text-white'}`}>
                    <Icon className="w-4 h-4" /><span className="flex-1 text-left">{label}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 text-white ${filter === key ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
                  </button>
                ))}
              </nav>
            </aside>

            <main className="flex-1 min-w-0 min-h-0 flex flex-col max-w-350 px-4 sm:px-6 py-6">
              {!isBackendOnline && (
                <div className="shrink-0 mb-5 flex items-start gap-3 rounded border border-[#F5CD47] bg-[#FFF7D6] px-4 py-3 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-[#946F00] shrink-0" />
                  <p className="flex-1"><span className="font-semibold">Backend offline.</span> Displaying cached tasks.</p>
                </div>
              )}

              <div className="shrink-0 flex items-end justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-[#5C636A] mb-1">Tasks / {filterTitle}</p>
                  <h1 className="text-2xl font-semibold">{filterTitle}</h1>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                <div className={`${mobilePanel === 'tasks' ? 'flex' : 'hidden'} xl:flex min-w-0 min-h-0 flex-col bg-white border border-[#DEE2E6] rounded-md overflow-hidden`}>
                  <div className="shrink-0 hidden sm:grid grid-cols-[2rem_5rem_1fr_9rem_8rem] gap-3 px-4 h-10 items-center border-b border-[#DEE2E6] bg-[#F8F9FA] text-xs font-semibold text-[#5C636A]">
                    <span /><span>Key</span><span>Summary</span><span>Status</span><span className="text-right">Actions</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {isFirstLoad ? (
                      <div className="p-4 text-sm text-[#5C636A]">Loading tasks...</div>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-14 text-center"><p className="font-semibold">No tasks found</p></div>
                    ) : (
                      <ul className="divide-y divide-[#DEE2E6]">
                        {filteredTasks.map((task) => {
                          const urgent = !task.completed && task.urgent;
                          const pinned = !task.completed && task.pinned;

                          return (
                            <li key={task.id} className={`grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_5rem_1fr_9rem_8rem] gap-3 px-4 py-3 items-center hover:bg-[#F8F9FA] transition-colors ${pinned ? 'bg-[#FFF9F0] shadow-[inset_3px_0_0_#D97706]' : urgent ? 'shadow-[inset_3px_0_0_#BF5700]' : ''}`}>
                              <button onClick={() => toggleComplete(task)} className="text-[#5C636A] hover:text-[#1F845A]">
                                {task.completed ? <CheckCircle2 className="w-5 h-5 text-[#1F845A]" /> : <Circle className="w-5 h-5" />}
                              </button>
                              <span className="hidden sm:block text-xs text-[#5C636A] font-medium">{getTaskKey(task)}</span>
                              <button onClick={() => openEditModal(task)} className="min-w-0 text-left cursor-pointer">
                                <p className={`text-sm font-medium truncate hover:underline ${task.completed ? 'line-through text-[#5C636A]' : ''}`}>
                                  {pinned && <Pin className="inline w-3.5 h-3.5 mr-1 text-[#D97706]" />}
                                  {urgent && <Flag className="inline w-3.5 h-3.5 mr-1 text-[#BF5700]" />}
                                  {task.title}
                                </p>
                                {task.description && <p className="text-xs text-[#5C636A] mt-0.5 truncate">{task.description}</p>}
                              </button>
                              <div className="hidden sm:flex items-center gap-1 min-w-0 flex-wrap">
                                {pinned && <span className="px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase bg-[#FEF3C7] text-[#B45309]">Pinned</span>}
                                {urgent && <span className="px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase bg-[#FFEAD6] text-[#A34A00]">Urgent</span>}
                                <span className={`px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase ${task.completed ? 'bg-[#DCFFF1] text-[#216E4E]' : 'bg-[#E9ECEF] text-[#495057]'}`}>{task.completed ? 'Done' : 'To do'}</span>
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                {!task.completed && (
                                  <>
                                    <button onClick={() => togglePinned(task)} title={pinned ? 'Unpin' : 'Pin'} className={`p-1.5 rounded cursor-pointer ${pinned ? 'text-[#B45309] bg-[#FEF3C7]' : 'text-[#495057] hover:bg-[#FEF3C7] hover:text-[#B45309]'}`}><Pin className="w-4 h-4" /></button>
                                    <button onClick={() => toggleUrgent(task)} title={urgent ? 'Unmark urgent' : 'Mark urgent'} className={`p-1.5 rounded cursor-pointer ${urgent ? 'text-[#A34A00] bg-[#FFEAD6]' : 'text-[#495057] hover:bg-[#FFEAD6] hover:text-[#A34A00]'}`}><Flag className="w-4 h-4" /></button>
                                  </>
                                )}
                                <button onClick={() => openEditModal(task)} title="Edit" className="p-1.5 rounded text-[#495057] hover:bg-[#21252914]"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => setTaskToDelete(task)} title="Delete" className="p-1.5 rounded text-[#495057] hover:bg-[#FFECEB] hover:text-[#C9372C]"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  {!isFirstLoad && (
                    <form onSubmit={handleQuickAdd} className="shrink-0 flex items-center gap-3 px-4 h-12 border-t border-[#DEE2E6] bg-[#F8F9FA]">
                      <Plus className="w-5 h-5 text-[#5C636A] shrink-0" />
                      <input type="text" placeholder="Create a task and press Enter" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} className="flex-1 bg-transparent text-sm placeholder-[#5C636A] focus:outline-none" />
                    </form>
                  )}
                </div>

                <section className={`${mobilePanel === 'daily' ? 'flex' : 'hidden'} xl:flex min-w-0 min-h-0 flex-col bg-white border border-[#DEE2E6] rounded-md overflow-hidden`}>
                  <div className="shrink-0 px-4 py-3 border-b border-[#DEE2E6] bg-[#F8F9FA]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0"><Repeat className="w-4 h-4 text-[#495057] shrink-0" /><h2 className="text-sm font-semibold truncate">Daily tasks</h2></div>
                      <span className="text-xs font-semibold shrink-0 text-[#5C636A]">{dailyDoneCount}/{dailyTasks.length} today</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <ul className="divide-y divide-[#DEE2E6]">
                      {dailyTasks.map((daily) => {
                        const done = daily.lastCompleted === today;
                        return (
                          <li key={daily.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA]">
                            <button onClick={() => toggleDaily(daily)} className="shrink-0 text-[#5C636A] hover:text-[#1F845A]">{done ? <CheckCircle2 className="w-5 h-5 text-[#1F845A]" /> : <Circle className="w-5 h-5" />}</button>
                            <span className={`flex-1 min-w-0 truncate text-sm font-medium ${done ? 'line-through text-[#5C636A]' : ''}`}>{daily.title}</span>
                            <button onClick={() => deleteDaily(daily.id)} className="p-1.5 rounded text-[#495057] hover:bg-[#FFECEB] hover:text-[#C9372C]"><Trash2 className="w-4 h-4" /></button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <form onSubmit={handleAddDaily} className="shrink-0 flex items-center gap-3 px-4 h-12 border-t border-[#DEE2E6] bg-[#F8F9FA]">
                    <Plus className="w-5 h-5 text-[#5C636A] shrink-0" />
                    <input type="text" placeholder="Add a daily task and press Enter" value={dailyTitle} onChange={(e) => setDailyTitle(e.target.value)} className="flex-1 min-w-0 bg-transparent text-sm placeholder-[#5C636A] focus:outline-none" />
                  </form>
                </section>
              </div>
            </main>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 bg-[#2125298A]" onClick={closeModal}>
              <div className="bg-white rounded-md w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit task' : 'Create task'}</h2>
                <form onSubmit={handleSaveTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#495057] mb-1">Summary *</label>
                    <input type="text" required autoFocus value={currentTask.title} onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })} className="w-full h-10 bg-[#F8F9FA] border-2 border-[#DEE2E6] rounded px-3 text-sm focus:outline-none focus:border-[#212529]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#495057] mb-1">Description</label>
                    <textarea rows={3} value={currentTask.description || ''} onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })} className="w-full bg-[#F8F9FA] border-2 border-[#DEE2E6] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#212529] resize-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={currentTask.pinned || false} onChange={(e) => setCurrentTask({ ...currentTask, pinned: e.target.checked })} className="w-4 h-4 rounded-sm accent-[#D97706]" />
                      <Pin className="w-3.5 h-3.5 text-[#D97706]" /> Pin task to the top
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={currentTask.urgent || false} onChange={(e) => setCurrentTask({ ...currentTask, urgent: e.target.checked })} className="w-4 h-4 rounded-sm accent-[#BF5700]" />
                      <Flag className="w-3.5 h-3.5 text-[#BF5700]" /> Mark as urgent
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={closeModal} className="h-9 px-3 rounded text-sm text-[#495057] hover:bg-[#2125290F]">Cancel</button>
                    <button type="submit" className="h-9 px-3 rounded bg-[#212529] text-white text-sm font-medium hover:bg-[#495057]">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {taskToDelete && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-32 bg-[#2125298A]" onClick={() => setTaskToDelete(null)}>
              <div className="bg-white rounded-md w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold">Delete task?</h2>
                <p className="text-sm text-[#495057] mt-2">"{taskToDelete.title}" will be permanently deleted.</p>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setTaskToDelete(null)} className="h-9 px-3 rounded text-sm text-[#495057]">Cancel</button>
                  <button onClick={confirmDelete} className="h-9 px-3 rounded bg-[#C9372C] text-white text-sm font-medium">Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed right-4 ${toastPosition} z-60 flex items-start gap-2.5 rounded px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'error' ? 'bg-[#C9372C]' : 'bg-[#212529]'}`}>
          <span className="flex-1">{toast.message}</span>
        </div>
      )}
    </>
  );
}