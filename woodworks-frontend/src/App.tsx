import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, Plus, Trash2, Pencil, Search,
  RefreshCw, ListTodo, CheckSquare, Clock, X, AlertTriangle, SquareCheckBig,
  Eye, EyeOff
} from 'lucide-react';

const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true' || (import.meta as any).env.VITE_DEMO_MODE === 'true';

const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'https://woodworks-backend-75805996486.asia-southeast1.run.app';
const API_BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api/tasks`;

interface Task {
  id: number | null;
  title: string;
  description: string;
  completed: boolean;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  // Auth states
  const [token, setToken] = useState<string | null>(localStorage.getItem('woodworks_token'));
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth UI-only states (never sent to the backend)
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>({ id: null, title: '', description: '', completed: false });
  const [isEditing, setIsEditing] = useState(false);

  // UI-only states (never sent to the backend)
  const [isSaving, setIsSaving] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: Toast['type'] = 'success') => setToast({ message, type });

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Switching between Sign in / Sign up resets the form so errors and passwords don't carry over
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
      } catch {
        // Response had no JSON body; fall through to the generic message below
      }

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      // Save token and update state (the effect below loads this user's tasks)
      localStorage.setItem('woodworks_token', data.token);
      setToken(data.token);
      setEmailInput('');
      setPasswordInput('');
      setConfirmPasswordInput('');
      setShowPassword(false);
      showToast(authView === 'login' ? 'Logged in successfully' : 'Account created successfully');
    } catch (err: any) {
      if (err instanceof TypeError) {
        setAuthError("Couldn't reach the server. Check your connection and try again.");
      } else {
        setAuthError(err.message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('woodworks_token');
    setToken(null);
    setTasks([]);
    showToast('Logged out');
  };

  // Fetch tasks on mount
  useEffect(() => {
    if (isDemoMode || token) {
      fetchTasks();
    }
  }, [token]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchTasks = async () => {
    setLoading(true);
    if (isDemoMode) {
      // Demo mode: use local mock data immediately
      setTimeout(() => {
        setTasks([
          { id: 1, title: 'Review Q4 Cloud Architecture', description: 'Analyze GCP Cloud Run scaling parameters', completed: true },
          { id: 2, title: 'Implement AI Task Assistant', description: 'Draft natural language CRUD prompt handlers', completed: false },
          { id: 3, title: 'Optimize PostgreSQL Queries', description: 'Review Neon connection pooler performance', completed: false }
        ]);
        setIsBackendOnline(true);
        setLoading(false);
      }, 300);
      return;
    }

    // Normal live backend fetching...
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Backend offline');
      const data = await response.json();
      setTasks(data);
      setIsBackendOnline(true);
    } catch (error) {
      console.warn('Spring Boot backend not detected. Switching to offline mock mode.');
      setIsBackendOnline(false);
      if (tasks.length === 0) {
        setTasks([
          { id: 1, title: 'Configure PostgreSQL Container', description: 'Docker compose setup complete', completed: true },
          { id: 2, title: 'Build Spring Boot REST API', description: 'Implement controllers, services, and DTOs', completed: true },
          { id: 3, title: 'Connect React Frontend', description: 'Wire up UI with Tailwind CSS', completed: false }
        ]);
      }
    } finally {
      setLoading(false);
    }
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
      showToast(isEditing ? 'Task updated (Demo Mode)' : 'Task created (Demo Mode)');
      return;
    }

    if (isBackendOnline) {
      setIsSaving(true);
      try {
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_BASE_URL}/${currentTask.id}` : API_BASE_URL;

        const response = await fetch(url, {
          method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: currentTask.title,
            description: currentTask.description,
            completed: currentTask.completed
          })
        });

        if (response.ok) {
          fetchTasks();
          closeModal();
          showToast(isEditing ? 'Task updated' : 'Task created');
        } else {
          showToast("Couldn't save the task. Try again.", 'error');
        }
      } catch (err) {
        console.error('Failed to save task to backend', err);
        showToast("Couldn't reach the server. Your task wasn't saved.", 'error');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Offline fallback behavior
      if (isEditing) {
        setTasks(tasks.map(t => t.id === currentTask.id ? currentTask : t));
      } else {
        setTasks([...tasks, { ...currentTask, id: Date.now() }]);
      }
      closeModal();
      showToast(isEditing ? 'Task updated' : 'Task created');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    if (isDemoMode) {
      setTasks([...tasks, { id: Date.now(), title, description: '', completed: false }]);
      setQuickTitle('');
      showToast('Task created (Demo Mode)');
      return;
    }

    if (isBackendOnline) {
      try {
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, description: '', completed: false })
        });
        if (response.ok) {
          setQuickTitle('');
          fetchTasks();
          showToast('Task created');
        } else {
          showToast("Couldn't create the task. Try again.", 'error');
        }
      } catch (err) {
        console.error('Failed to create task', err);
        showToast("Couldn't reach the server. Your task wasn't created.", 'error');
      }
    } else {
      setTasks([...tasks, { id: Date.now(), title, description: '', completed: false }]);
      setQuickTitle('');
      showToast('Task created');
    }
  };

  const handleDeleteTask = async (id: number | null) => {
    if (isDemoMode) {
      setTasks(tasks.filter(t => t.id !== id));
      showToast('Task deleted (Demo Mode)');
      return;
    }

    if (isBackendOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setTasks(tasks.filter(t => t.id !== id));
          showToast('Task deleted');
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
    
    if (isDemoMode) {
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
      return;
    }

    if (isBackendOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/${task.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
        if (response.ok) {
          setTasks(tasks.map(t => t.id === task.id ? updated : t));
        } else {
          showToast("Couldn't update the status. Try again.", 'error');
        }
      } catch (err) {
        console.error('Failed to update status', err);
        showToast("Couldn't reach the server. The status wasn't changed.", 'error');
      }
    } else {
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    }
  };

  const openCreateModal = () => {
    setCurrentTask({ id: null, title: '', description: '', completed: false });
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
    setCurrentTask({ id: null, title: '', description: '', completed: false });
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;
    setTaskToDelete(null);
    await handleDeleteTask(id);
  };

  // Escape closes whichever dialog is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (taskToDelete) setTaskToDelete(null);
      else if (isModalOpen) closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, taskToDelete]);

  // Filter & Search logic
  // Filter & Sort logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filter === 'PENDING') return matchesSearch && !task.completed;
    if (filter === 'COMPLETED') return matchesSearch && task.completed;
    return matchesSearch;
  }).sort((a, b) => {
    // Rule 1: Unfinished tasks always come before completed tasks
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Rule 2 & 3: If both are unfinished or both are completed, sort by creation date (ID)
    // Higher ID = created later (Newest)
    const idA = a.id || 0;
    const idB = b.id || 0;

    if (sortOrder === 'newest') {
      return idB - idA; // Latest at the top
    } else {
      return idA - idB; // Oldest at the top
    }
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  // Stable display keys: rank by creation order (ID) across ALL tasks,
  // so sorting, filtering and searching never change a task's key
  const taskKeys = new Map<number | null, number>(
    [...tasks]
      .sort((a, b) => (a.id || 0) - (b.id || 0))
      .map((t, i) => [t.id, i + 1] as [number | null, number])
  );
  const getTaskKey = (task: Task) => `WW-${taskKeys.get(task.id) ?? '?'}`;

  const navItems = [
    { key: 'ALL', label: 'All tasks', icon: ListTodo, count: tasks.length },
    { key: 'PENDING', label: 'To do', icon: Clock, count: pendingCount },
    { key: 'COMPLETED', label: 'Done', icon: CheckSquare, count: completedCount },
  ];

  const filterTitle = navItems.find(n => n.key === filter)?.label ?? 'All tasks';
  const isFirstLoad = loading && tasks.length === 0;

  const authInputClass =
    'w-full h-11 bg-white border-2 border-[#DFE1E6] hover:bg-[#F7F8F9] rounded px-3 text-sm placeholder-[#626F86] focus:outline-none focus:border-[#4C9AFF] focus:bg-white';

  return (
    <>
      {!isDemoMode && !token ? (
        <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">

          {/* Brand panel (desktop only) */}
          <div className="hidden lg:flex flex-col justify-between bg-[#0C66E4] text-white p-12">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-white text-[#0C66E4] flex items-center justify-center font-bold">
                W
              </div>
              <span className="font-semibold text-lg">WoodWorks</span>
            </div>

            <div className="max-w-md">
              <h2 className="text-3xl font-semibold leading-tight">
                Keep every task moving, from to do to done.
              </h2>
              <ul className="mt-8 space-y-4 text-sm">
                {[
                  { icon: ListTodo, text: 'Capture tasks in seconds with quick add' },
                  { icon: Search, text: 'Search and filter by status instantly' },
                  { icon: CheckSquare, text: 'See your progress at a glance' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded bg-white/15 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-white/80">Personal Task Management System</p>
          </div>

          {/* Form panel */}
          <div className="flex items-center justify-center px-6 py-12 bg-[#F7F8F9] lg:bg-white">
            <div className="w-full max-w-sm">

              {/* Logo for small screens (brand panel is hidden) */}
              <div className="lg:hidden flex items-center gap-2.5 mb-8">
                <div className="w-9 h-9 rounded bg-[#0C66E4] text-white flex items-center justify-center font-bold">
                  W
                </div>
                <span className="font-semibold text-lg">WoodWorks</span>
              </div>

              <h1 className="text-2xl font-semibold">
                {authView === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-[#626F86] mt-1.5">
                {authView === 'login'
                  ? 'Sign in to manage your tasks.'
                  : 'Sign up to start organizing your tasks.'}
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 p-3 bg-[#FFECEB] border border-[#C9372C33] text-[#AE2E24] text-sm rounded"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-[#44546F] mb-1">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@example.com"
                    className={authInputClass}
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-[#44546F] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={authView === 'login' ? 'current-password' : 'new-password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter your password"
                      className={`${authInputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded text-[#626F86] hover:bg-[#091E420F] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authView === 'register' && (
                  <div>
                    <label htmlFor="auth-confirm" className="block text-xs font-semibold text-[#44546F] mb-1">
                      Confirm password
                    </label>
                    <input
                      id="auth-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter your password"
                      className={authInputClass}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#0C66E4] hover:bg-[#0055CC] text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:bg-[#091E420F] disabled:text-[#8993A4] disabled:cursor-not-allowed"
                >
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isAuthLoading
                    ? (authView === 'login' ? 'Signing in...' : 'Creating account...')
                    : (authView === 'login' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#626F86]">
                {authView === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button onClick={() => switchAuthView('register')} className="text-[#0C66E4] font-medium hover:underline cursor-pointer">
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => switchAuthView('login')} className="text-[#0C66E4] font-medium hover:underline cursor-pointer">
                      Sign in
                    </button>
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-[#DFE1E6] text-center">
                <a
                  href="?demo=true"
                  className="inline-flex items-center justify-center w-full h-10 rounded border border-[#DFE1E6] bg-white text-sm font-medium text-[#44546F] hover:bg-[#091E420F] transition-colors"
                >
                  Try the demo without an account
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-[#F7F8F9] text-[#172B4D]">

          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div className="bg-[#E9F2FF] border-b border-[#0C66E433] px-4 py-2 text-xs text-[#0C66E4] flex items-center justify-between font-medium">
              <span>💡 <strong>Demo Mode:</strong> You are testing an interactive sandbox. Changes won't affect live production data.</span>
              <a href="https://github.com/vnclrd/woodworks" target="_blank" rel="noreferrer" className="underline hover:text-[#0055CC]">View Source</a>
            </div>
          )}

          {/* Top navigation */}
          <header className="h-14 bg-white border-b border-[#DFE1E6] flex items-center gap-4 px-4 sticky top-0 z-20">
            <div className="flex items-center gap-2.5 w-52 shrink-0">
              <div className="w-8 h-8 rounded bg-[#0C66E4] text-white flex items-center justify-center text-sm font-bold">
                W
              </div>
              <span className="font-semibold text-[15px]">WoodWorks</span>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#626F86]" />
              <input
                type="text"
                aria-label="Search tasks"
                placeholder="Search tasks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-white border-2 border-[#DFE1E6] hover:bg-[#F7F8F9] rounded pl-9 pr-9 text-sm placeholder-[#626F86] focus:outline-none focus:border-[#4C9AFF] focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#626F86] hover:bg-[#091E420F] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sorting Toggle Button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              title="Toggle creation date sort"
              className="h-9 px-3 flex items-center gap-1.5 rounded border border-[#DFE1E6] bg-white text-xs font-medium text-[#44546F] hover:bg-[#091E420F] transition-colors cursor-pointer shrink-0"
            >
              <span>Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={fetchTasks}
                title="Refresh tasks"
                aria-label="Refresh tasks"
                className="h-9 w-9 flex items-center justify-center rounded text-[#44546F] hover:bg-[#091E420F] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={openCreateModal}
                className="h-9 flex items-center gap-1.5 px-3 rounded bg-[#0C66E4] hover:bg-[#0055CC] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
              {!isDemoMode && (
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="h-9 px-3 text-xs font-medium text-[#44546F] hover:bg-[#091E420F] rounded transition-colors cursor-pointer"
                >
                  Logout
                </button>
              )}
            </div>
          </header>

          <div className="flex flex-1">

            {/* Sidebar */}
            <aside className="hidden md:block w-64 shrink-0 bg-white border-r border-[#DFE1E6] p-3">
              <div className="flex items-center gap-3 px-2 py-3 mb-2">
                <div className="w-9 h-9 rounded bg-[#E9F2FF] text-[#0C66E4] flex items-center justify-center">
                  <SquareCheckBig className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">WoodWorks Tasks</p>
                  <p className="text-xs text-[#626F86]">Task management</p>
                </div>
              </div>

              <nav className="space-y-0.5" aria-label="Task filters">
                {navItems.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    aria-current={filter === key ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded text-sm transition-colors cursor-pointer ${
                      filter === key
                        ? 'bg-[#E9F2FF] text-[#0C66E4] font-semibold'
                        : 'text-[#44546F] hover:bg-[#091E420F]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{label}</span>
                    <span className="text-xs rounded-full bg-[#091E420F] px-2 py-0.5 text-[#44546F]">{count}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 px-2.5">
                <p className="text-xs font-semibold text-[#626F86] mb-2">Progress</p>
                <div className="h-2 rounded-full bg-[#DFE1E6] overflow-hidden">
                  <div
                    className="h-full bg-[#1F845A] transition-[width] duration-300"
                    style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-[#626F86] mt-1.5">{completedCount} of {tasks.length} done</p>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 px-6 py-6 max-w-5xl">

              {!isBackendOnline && (
                <div className="mb-5 flex items-start gap-3 rounded border border-[#F5CD47] bg-[#FFF7D6] px-4 py-3 text-sm" role="status">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-[#946F00] shrink-0" />
                  <p className="flex-1">
                    <span className="font-semibold">Can't reach the server.</span>{' '}
                    Showing sample tasks. Changes stay in this browser until the Spring Boot backend is running.
                  </p>
                  <button
                    onClick={fetchTasks}
                    className="shrink-0 h-7 px-2.5 rounded text-xs font-semibold text-[#172B4D] hover:bg-[#091E4214] cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-[#626F86] mb-1">Tasks / {filterTitle}</p>
                  <h1 className="text-2xl font-semibold">{filterTitle}</h1>
                  {!isFirstLoad && (
                    <p className="text-sm text-[#626F86] mt-1">
                      {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  )}
                </div>

                {/* Filter tabs for small screens (sidebar is hidden) */}
                <div className="md:hidden flex rounded border border-[#DFE1E6] bg-white overflow-hidden">
                  {['ALL', 'PENDING', 'COMPLETED'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-3 h-8 text-xs font-medium cursor-pointer ${
                        filter === tab ? 'bg-[#E9F2FF] text-[#0C66E4]' : 'text-[#44546F]'
                      }`}
                    >
                      {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task list */}
              <div className="bg-white border border-[#DFE1E6] rounded-md overflow-hidden">
                <div className="hidden sm:grid grid-cols-[2rem_5rem_1fr_6.5rem_5.5rem] gap-3 px-4 h-10 items-center border-b border-[#DFE1E6] bg-[#F7F8F9] text-xs font-semibold text-[#626F86]">
                  <span />
                  <span>Key</span>
                  <span>Summary</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                {isFirstLoad ? (
                  <ul className="divide-y divide-[#DFE1E6]" aria-busy="true" aria-label="Loading tasks">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="px-4 py-4 flex items-center gap-3 animate-pulse">
                        <div className="w-5 h-5 rounded-full bg-[#DFE1E6]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-1/3 rounded bg-[#DFE1E6]" />
                          <div className="h-3 w-1/2 rounded bg-[#EFF1F3]" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : filteredTasks.length === 0 ? (
                  <div className="py-14 text-center">
                    <p className="font-semibold">
                      {tasks.length === 0 ? 'No tasks yet' : 'No tasks match this view'}
                    </p>
                    <p className="text-sm text-[#626F86] mt-1">
                      {tasks.length === 0
                        ? 'Add your first task below or use Create.'
                        : 'Clear the search or switch filters to see more.'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#DFE1E6]">
                    {filteredTasks.map((task) => (
                      <li
                        key={task.id}
                        className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_5rem_1fr_6.5rem_5.5rem] gap-3 px-4 py-3 items-center hover:bg-[#F7F8F9] transition-colors group"
                      >
                        <button
                          onClick={() => toggleComplete(task)}
                          aria-label={task.completed ? 'Mark as to do' : 'Mark as done'}
                          className="text-[#626F86] hover:text-[#1F845A] transition-colors cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-[#1F845A]" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <span className="hidden sm:block text-xs text-[#626F86] font-medium">{getTaskKey(task)}</span>

                        {/* Clicking the summary opens the task for editing */}
                        <button
                          onClick={() => openEditModal(task)}
                          className="min-w-0 text-left cursor-pointer"
                        >
                          <p className={`text-sm font-medium truncate hover:underline ${task.completed ? 'line-through text-[#626F86]' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-[#626F86] mt-0.5 truncate">{task.description}</p>
                          )}
                        </button>

                        <span
                          className={`hidden sm:inline-flex justify-self-start items-center px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase ${
                            task.completed
                              ? 'bg-[#DCFFF1] text-[#216E4E]'
                              : 'bg-[#DFE1E6] text-[#44546F]'
                          }`}
                        >
                          {task.completed ? 'Done' : 'To do'}
                        </span>

                        <div className="flex items-center justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(task)}
                            aria-label="Edit task"
                            className="p-1.5 rounded text-[#44546F] hover:bg-[#091E4224] cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTaskToDelete(task)}
                            aria-label="Delete task"
                            className="p-1.5 rounded text-[#44546F] hover:bg-[#FFECEB] hover:text-[#C9372C] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Quick add row */}
                {!isFirstLoad && (
                  <form
                    onSubmit={handleQuickAdd}
                    className="flex items-center gap-3 px-4 h-12 border-t border-[#DFE1E6] bg-[#F7F8F9] focus-within:bg-white"
                  >
                    <Plus className="w-5 h-5 text-[#626F86] shrink-0" />
                    <input
                      type="text"
                      aria-label="Task summary"
                      placeholder="Create a task and press Enter"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      className="flex-1 bg-transparent text-sm placeholder-[#626F86] focus:outline-none"
                    />
                  </form>
                )}
              </div>
            </main>
          </div>

          {/* Create / Edit modal */}
          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 bg-[#091E428A]"
              onClick={closeModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={isEditing ? 'Edit task' : 'Create task'}
                className="bg-white rounded-md w-full max-w-lg shadow-[0_8px_12px_#091E4226,0_0_1px_#091E424F]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                  <div>
                    {isEditing && <p className="text-xs text-[#626F86] mb-0.5">{getTaskKey(currentTask)}</p>}
                    <h2 className="text-xl font-semibold">{isEditing ? 'Edit task' : 'Create task'}</h2>
                  </div>
                  <button
                    onClick={closeModal}
                    aria-label="Close"
                    className="p-1.5 rounded text-[#44546F] hover:bg-[#091E420F] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} className="px-6 pb-5 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-xs font-semibold text-[#44546F] mb-1">
                      Summary <span className="text-[#C9372C]">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      autoFocus
                      placeholder="What needs to be done?"
                      value={currentTask.title}
                      onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                      className="w-full h-10 bg-[#F7F8F9] border-2 border-[#DFE1E6] hover:bg-[#EFF1F3] rounded px-3 text-sm placeholder-[#626F86] focus:outline-none focus:border-[#4C9AFF] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-xs font-semibold text-[#44546F] mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      placeholder="Add details about this task"
                      value={currentTask.description || ''}
                      onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                      className="w-full bg-[#F7F8F9] border-2 border-[#DFE1E6] hover:bg-[#EFF1F3] rounded px-3 py-2 text-sm placeholder-[#626F86] focus:outline-none focus:border-[#4C9AFF] focus:bg-white resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="completed"
                      checked={currentTask.completed}
                      onChange={(e) => setCurrentTask({ ...currentTask, completed: e.target.checked })}
                      className="w-4 h-4 rounded-sm accent-[#0C66E4] cursor-pointer"
                    />
                    <label htmlFor="completed" className="text-sm cursor-pointer">
                      Mark as completed
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="h-9 px-3 rounded text-sm font-medium text-[#44546F] hover:bg-[#091E420F] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || !currentTask.title.trim()}
                      className="h-9 px-3 rounded bg-[#0C66E4] hover:bg-[#0055CC] text-white text-sm font-medium transition-colors cursor-pointer disabled:bg-[#091E420F] disabled:text-[#8993A4] disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {taskToDelete && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-32 bg-[#091E428A]"
              onClick={() => setTaskToDelete(null)}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-label="Delete task"
                className="bg-white rounded-md w-full max-w-sm p-6 shadow-[0_8px_12px_#091E4226,0_0_1px_#091E424F]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold">Delete {getTaskKey(taskToDelete)}?</h2>
                <p className="text-sm text-[#44546F] mt-2 wrap-break-words">
                  "{taskToDelete.title}" will be permanently deleted. This can't be undone.
                </p>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    onClick={() => setTaskToDelete(null)}
                    autoFocus
                    className="h-9 px-3 rounded text-sm font-medium text-[#44546F] hover:bg-[#091E420F] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="h-9 px-3 rounded bg-[#C9372C] hover:bg-[#AE2E24] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div
              role="status"
              className={`fixed bottom-6 left-6 z-60 max-w-sm rounded px-4 py-3 text-sm font-medium text-white shadow-[0_8px_12px_#091E4226] ${
                toast.type === 'error' ? 'bg-[#C9372C]' : 'bg-[#172B4D]'
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>
      )}
    </>
  );
}