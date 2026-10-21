import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Circle, Plus, Trash2, Pencil, Search,
  RefreshCw, ListTodo, CheckSquare, Clock, X, AlertTriangle, SquareCheckBig,
  Eye, EyeOff, LogOut, Flag, Repeat, Pin,
  Sparkles, Send, PanelRightClose, PanelRightOpen, RotateCcw
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

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  role: 'assistant',
  text: "Hi! I'm your task assistant. Once I'm connected, I can help you plan your day, summarize your tasks and keep track of what's urgent."
};

const CHAT_SUGGESTIONS = [
  'Summarize my open tasks',
  "What's urgent today?",
  'Help me plan my day',
];

// Tracks a CSS media query so the layout can adapt in JavaScript
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
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

  // AI assistant chat bar (UI only: no AI is connected yet)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const hasRoomForBothCardsWithChat = useMediaQuery('(min-width: 1440px)'); // two cards + open chat bar
  const hasRoomForBothCardsWithRail = useMediaQuery('(min-width: 1240px)'); // two cards + collapsed chat rail
  const [isChatOpen, setIsChatOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [chatInput, setChatInput] = useState('');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      (persist ? sessionStorage : localStorage).removeItem(TOKEN_KEY);

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
      if (err instanceof TypeError) {
        setAuthError("Couldn't reach the server. Check your connection and try again.");
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
        const mockTasks = [
          { id: 1, title: 'Review Q4 Cloud Architecture', description: 'Analyze GCP Cloud Run scaling parameters', completed: true, pinned: false, urgent: false },
          { id: 2, title: 'Implement AI Task Assistant', description: 'Draft natural language CRUD prompt handlers', completed: false, pinned: true, urgent: false },
          { id: 3, title: 'Optimize PostgreSQL Queries', description: 'Review Neon connection pooler performance', completed: false, pinned: false, urgent: true }
        ];
        setTasks(mockTasks);
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
      if (tasks.length === 0) {
        setTasks([
          { id: 1, title: 'Configure PostgreSQL Container', description: 'Docker compose setup complete', completed: true, pinned: false, urgent: false },
          { id: 2, title: 'Build Spring Boot REST API', description: 'Implement controllers, services, and DTOs', completed: true, pinned: false, urgent: false },
          { id: 3, title: 'Connect React Frontend', description: 'Wire up UI with Tailwind CSS', completed: false, pinned: false, urgent: false }
        ]);
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
        headers: { 'Authorization': `Bearer ${token}` }
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
      const updated = [...dailyTasks, { id: Date.now(), title, lastCompleted: null }];
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, lastCompleted: null })
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
      const updatedList = dailyTasks.map(d => d.id === daily.id ? updatedTask : d);
      setDailyTasks(updatedList);
      localStorage.setItem(DAILY_KEY, JSON.stringify(updatedList));
      return;
    }

    try {
      const response = await fetch(`${DAILY_API_BASE_URL}/${daily.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTask)
      });

      if (response.ok) {
        setDailyTasks(prev => prev.map(d => d.id === daily.id ? updatedTask : d));
      } else {
        showToast("Couldn't update daily task.", 'error');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  const deleteDaily = async (id: number) => {
    if (isDemoMode) {
      const updatedList = dailyTasks.filter(d => d.id !== id);
      setDailyTasks(updatedList);
      localStorage.setItem(DAILY_KEY, JSON.stringify(updatedList));
      showToast('Daily task removed (Demo Mode)');
      return;
    }

    try {
      const response = await fetch(`${DAILY_API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setDailyTasks(prev => prev.filter(d => d.id !== id));
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
            completed: currentTask.completed,
            pinned: currentTask.pinned ?? false,
            urgent: currentTask.urgent ?? false
          })
        });

        if (response.ok) {
          fetchTasks(true);
          closeModal();
          showToast(isEditing ? 'Task updated' : 'Task created');
        } else {
          showToast("Couldn't save the task. Try again.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach the server. Your task wasn't saved.", 'error');
      } finally {
        setIsSaving(false);
      }
    } else {
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
      setTasks([...tasks, { id: Date.now(), title, description: '', completed: false, pinned: false, urgent: false }]);
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
          body: JSON.stringify({ title, description: '', completed: false, pinned: false, urgent: false })
        });
        if (response.ok) {
          setQuickTitle('');
          fetchTasks(true);
          showToast('Task created');
        } else {
          showToast("Couldn't create the task. Try again.", 'error');
        }
      } catch (err) {
        showToast("Couldn't reach the server.", 'error');
      }
    } else {
      setTasks([...tasks, { id: Date.now(), title, description: '', completed: false, pinned: false, urgent: false }]);
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
          headers: { 'Authorization': `Bearer ${token}` }
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
        showToast("Couldn't reach the server.", 'error');
      }
    } else {
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        setTasks(tasks.map(t => t.id === task.id ? updated : t));
        showToast(updated.urgent ? 'Marked as urgent' : 'Urgent tag removed');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        setTasks(tasks.map(t => t.id === task.id ? updated : t));
        showToast(updated.pinned ? 'Task pinned to top' : 'Pin removed');
      }
    } catch (err) {
      showToast("Couldn't reach the server.", 'error');
    }
  };

  // AI assistant chat (placeholder logic: replace the timeout with a real AI call later)
  const sendChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isAssistantTyping) return;

    setChatMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed }]);
    setChatInput('');
    setIsAssistantTyping(true);

    // TODO: replace this placeholder reply with a call to your AI backend
    chatTimerRef.current = setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: "The AI assistant isn't connected yet. Once it's integrated, I'll be able to help with this."
        }
      ]);
      setIsAssistantTyping(false);
    }, 900);
  };

  const resetChat = () => {
    if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    setChatMessages([WELCOME_MESSAGE]);
    setChatInput('');
    setIsAssistantTyping(false);
  };

  // Open by default on large screens (side column), closed on small ones (drawer)
  useEffect(() => {
    setIsChatOpen(isLargeScreen);
  }, [isLargeScreen]);

  // Keep the newest message in view
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isAssistantTyping, isChatOpen]);

  // Clear any pending reply timer on unmount
  useEffect(() => {
    return () => {
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, []);

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

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask({ id: null, title: '', description: '', completed: false, pinned: false, urgent: false });
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
      if (taskToDelete) setTaskToDelete(null);
      else if (isModalOpen) closeModal();
      else if (!isLargeScreen && isChatOpen) setIsChatOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, taskToDelete, isLargeScreen, isChatOpen]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filter === 'PENDING') return matchesSearch && !task.completed;
    if (filter === 'COMPLETED') return matchesSearch && task.completed;
    if (filter === 'URGENT') return matchesSearch && !task.completed && task.urgent;
    return matchesSearch;
  }).sort((a, b) => {
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

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const urgentCount = tasks.filter(t => !t.completed && t.urgent).length;

  const taskKeys = new Map<number | null, number>(
    [...tasks]
      .sort((a, b) => (a.id || 0) - (b.id || 0))
      .map((t, i) => [t.id, i + 1] as [number | null, number])
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
  const allDailyDone = dailyTasks.length > 0 && dailyDoneCount === dailyTasks.length;
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  // The two cards sit side by side only when there's room; the open chat bar takes extra width
  const isChatColumnOpen = isLargeScreen && isChatOpen;
  const cardsSideBySide = isChatColumnOpen ? hasRoomForBothCardsWithChat : hasRoomForBothCardsWithRail;

  const authInputClass =
    'w-full h-11 bg-white border-2 border-[#DEE2E6] hover:bg-[#F8F9FA] rounded px-3 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white';

  const isAuthScreen = !isDemoMode && !token;
  const toastPosition = isAuthScreen ? 'top-4' : isDemoMode ? 'top-[6.4rem]' : 'top-[4.25rem]';

  return (
    <>
      {isAuthScreen ? (
        <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
          <div className="hidden lg:flex flex-col justify-between bg-[#212529] text-white p-12">
            <div className="flex items-center gap-2.5">
              <img 
                src="/WoodWorksLogo.png"
                alt="WoodWorks Logo" 
                className="w-10 h-10 rounded-2xl object-contain shadow-sm"
              />
              <span className="font-semibold text-lg">WoodWorks</span>
            </div>

            <div className="max-w-md">
              <h2 className="text-3xl font-semibold leading-tight">
                Keep every task moving.
                <br />
                From <span className="text-[#BF5700] font-bold">to do</span>, to <span className="text-[#BF5700] font-bold">done</span>.
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

          <div className="flex items-center justify-center px-6 py-12 bg-[#F8F9FA] lg:bg-white">
            <div className="w-full max-w-sm">
              <div className="lg:hidden flex items-center gap-2.5 mb-8">
                <img 
                  src="/WoodWorksLogo.png"
                  alt="WoodWorks Logo" 
                  className="w-10 h-10 rounded-2xl object-contain shadow-sm"
                />
                <span className="font-semibold text-lg">WoodWorks</span>
              </div>

              <h1 className="text-2xl font-semibold text-[#212529]">
                {authView === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-[#5C636A] mt-1.5">
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
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-[#495057] mb-1">
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
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-[#495057] mb-1">
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
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded text-[#5C636A] hover:bg-[#2125290F] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authView === 'register' && (
                  <div>
                    <label htmlFor="auth-confirm" className="block text-xs font-semibold text-[#495057] mb-1">
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

                {authView === 'login' && (
                  <label
                    htmlFor="auth-remember"
                    title="Stay signed in and remember my email after closing the browser"
                    className="flex items-center gap-2 w-fit text-sm text-[#495057] cursor-pointer select-none"
                  >
                    <input
                      id="auth-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm accent-[#212529] cursor-pointer"
                    />
                    Remember me
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:bg-[#2125290F] disabled:text-[#868E96] disabled:cursor-not-allowed"
                >
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isAuthLoading
                    ? (authView === 'login' ? 'Signing in...' : 'Creating account...')
                    : (authView === 'login' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#5C636A]">
                {authView === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button onClick={() => switchAuthView('register')} className="text-[#212529] font-semibold hover:underline cursor-pointer">
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => switchAuthView('login')} className="text-[#212529] font-semibold hover:underline cursor-pointer">
                      Sign in
                    </button>
                  </p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-[#DEE2E6] text-center">
                <a
                  href="?demo=true"
                  className="inline-flex items-center justify-center w-full h-10 rounded border border-[#DEE2E6] bg-white text-sm font-medium text-[#495057] hover:bg-[#2125290F] transition-colors"
                >
                  Try the demo without an account
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-dvh flex flex-col overflow-hidden bg-[#F8F9FA] text-[#212529]">
          {isDemoMode && (
            <div className="shrink-0 bg-[#E9ECEF] border-b border-[#DEE2E6] px-4 py-2 text-xs text-[#212529] flex items-center justify-between gap-3 font-medium">
              <span>💡 <strong>Demo Mode:</strong> You are testing an interactive sandbox. Changes won't affect live production data.</span>
              <a href="https://github.com/vnclrd/woodworks" target="_blank" rel="noreferrer" className="shrink-0 underline hover:text-[#495057]">View Source</a>
            </div>
          )}

          <header className="shrink-0 h-14 bg-white border-b border-[#DEE2E6] flex items-center gap-2 sm:gap-4 px-4 z-20">
            <div className="flex items-center gap-2.5 shrink-0 md:w-60">
              <img 
                src="/WoodWorksLogo.png"
                alt="WoodWorks Logo" 
                className="w-10 h-10 rounded-2xl object-contain shadow-sm"
              />
              <span className="hidden sm:inline font-semibold text-[15px]">WoodWorks</span>
            </div>

            <div className="relative flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C636A]" />
              <input
                type="text"
                aria-label="Search tasks"
                placeholder="Search tasks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-white border-2 border-[#DEE2E6] hover:bg-[#F8F9FA] rounded pl-9 pr-9 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#5C636A] hover:bg-[#2125290F] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              title="Toggle creation date sort"
              className="h-9 px-3 flex items-center rounded border border-[#DEE2E6] bg-white text-xs font-medium text-[#495057] hover:bg-[#2125290F] transition-colors cursor-pointer shrink-0"
            >
              <span className="hidden sm:inline">Sort:&nbsp;</span>
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              <span className="hidden sm:inline">&nbsp;First</span>
            </button>

            <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
              {!isLargeScreen && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  title="AI assistant"
                  aria-label="Open AI assistant"
                  className="h-9 w-9 flex items-center justify-center rounded text-[#BF5700] hover:bg-[#FFEAD6] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { fetchTasks(false); fetchDailyTasks(); }}
                title="Refresh tasks"
                aria-label="Refresh tasks"
                className="h-9 w-9 flex items-center justify-center rounded text-[#495057] hover:bg-[#2125290F] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={openCreateModal}
                aria-label="Create task"
                className="h-9 flex items-center gap-1.5 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
              {!isDemoMode && (
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="h-9 px-2.5 sm:px-3 flex items-center gap-1.5 text-xs font-medium text-[#495057] hover:bg-[#2125290F] rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </header>

          <div className="flex flex-1 min-h-0">
            <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#212529] border-r border-white/10 p-3 overflow-y-auto">
              <div className="flex items-center gap-3 px-2 py-3 mb-2">
                <div className="w-9 h-9 rounded bg-white/10 text-white flex items-center justify-center">
                  <SquareCheckBig className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">WoodWorks Tasks</p>
                  <p className="text-xs text-white/60">Task management</p>
                </div>
              </div>

              <nav className="space-y-0.5" aria-label="Task filters">
                {navItems.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => { setFilter(key); setMobilePanel('tasks'); }}
                    aria-current={filter === key ? 'page' : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded text-sm transition-colors cursor-pointer ${
                      filter === key
                        ? 'bg-[#495057] text-white font-semibold'
                        : 'text-white/70 hover:bg-[#495057] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{label}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 text-white ${
                      filter === key ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 px-2.5">
                <p className="text-xs font-semibold text-white/60 mb-2">Progress</p>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-[#4BCE97] transition-[width] duration-300"
                    style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-white/60 mt-1.5">{completedCount} of {tasks.length} done</p>
              </div>
            </aside>

            <main className="flex-1 min-w-0 min-h-0 flex flex-col px-4 sm:px-6 py-6">
              {!isBackendOnline && (
                <div className="shrink-0 mb-5 flex items-start gap-3 rounded border border-[#F5CD47] bg-[#FFF7D6] px-4 py-3 text-sm" role="status">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-[#946F00] shrink-0" />
                  <p className="flex-1">
                    <span className="font-semibold">Backend waking up / offline.</span>{' '}
                    Displaying cached tasks. Changes sync automatically once online.
                  </p>
                  <button
                    onClick={() => fetchTasks(false)}
                    className="shrink-0 h-7 px-2.5 rounded text-xs font-semibold text-[#212529] hover:bg-[#21252914] cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="shrink-0 flex items-end justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-[#5C636A] mb-1">Tasks / {filterTitle}</p>
                  <h1 className="text-2xl font-semibold">{filterTitle}</h1>
                  {!isFirstLoad && (
                    <p className="text-sm text-[#5C636A] mt-1">
                      {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  )}
                </div>

                <div className="md:hidden shrink-0 flex rounded border border-[#DEE2E6] bg-white overflow-hidden">
                  {['ALL', 'PENDING', 'URGENT', 'COMPLETED'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setFilter(tab); setMobilePanel('tasks'); }}
                      className={`px-2.5 h-8 text-xs font-medium cursor-pointer transition-colors ${
                        filter === tab
                          ? 'bg-[#212529] text-white'
                          : 'text-[#495057] hover:bg-[#2125290F]'
                      }`}
                    >
                      {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${cardsSideBySide ? 'hidden' : 'flex'} shrink-0 mb-3 w-fit rounded border border-[#DEE2E6] bg-white overflow-hidden`}>
                {([
                  { key: 'tasks', label: 'Tasks' },
                  { key: 'daily', label: `Daily (${dailyDoneCount}/${dailyTasks.length})` },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMobilePanel(key)}
                    aria-pressed={mobilePanel === key}
                    className={`px-3 h-8 text-xs font-medium cursor-pointer transition-colors ${
                      mobilePanel === key
                        ? 'bg-[#212529] text-white'
                        : 'text-[#495057] hover:bg-[#2125290F]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={`flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] gap-4 ${cardsSideBySide ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
                <div className={`${cardsSideBySide || mobilePanel === 'tasks' ? 'flex' : 'hidden'} @container min-w-0 min-h-0 flex-col bg-white border border-[#DEE2E6] rounded-md overflow-hidden`}>
                  <div className="shrink-0 hidden @xl:grid grid-cols-[2rem_5rem_1fr_9rem_8rem] gap-3 px-4 h-10 items-center border-b border-[#DEE2E6] bg-[#F8F9FA] text-xs font-semibold text-[#5C636A]">
                    <span />
                    <span>Key</span>
                    <span>Summary</span>
                    <span>Status</span>
                    <span className="text-right">Actions</span>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {isFirstLoad ? (
                      <ul className="divide-y divide-[#DEE2E6]" aria-busy="true" aria-label="Loading tasks">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <li key={i} className="px-4 py-4 flex items-center gap-3 animate-pulse">
                            <div className="w-5 h-5 rounded-full bg-[#DEE2E6]" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 w-1/3 rounded bg-[#DEE2E6]" />
                              <div className="h-3 w-1/2 rounded bg-[#E9ECEF]" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : filteredTasks.length === 0 ? (
                      <div className="py-14 text-center">
                        <p className="font-semibold">
                          {tasks.length === 0 ? 'No tasks yet' : 'No tasks match this view'}
                        </p>
                        <p className="text-sm text-[#5C636A] mt-1">
                          {tasks.length === 0
                            ? 'Add your first task below or use Create.'
                            : 'Clear the search or switch filters to see more.'}
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#DEE2E6]">
                        {filteredTasks.map((task) => {
                          const urgent = !task.completed && task.urgent;
                          const pinned = !task.completed && task.pinned;

                          return (
                            <li
                              key={task.id}
                              className={`grid grid-cols-[2rem_1fr_auto] @xl:grid-cols-[2rem_5rem_1fr_9rem_8rem] gap-3 px-4 py-3 items-center hover:bg-[#F8F9FA] transition-colors ${
                                pinned ? 'bg-[#FFF9F0] shadow-[inset_3px_0_0_#D97706]' : urgent ? 'shadow-[inset_3px_0_0_#BF5700]' : ''
                              }`}
                            >
                              <button
                                onClick={() => toggleComplete(task)}
                                aria-label={task.completed ? 'Mark as to do' : 'Mark as done'}
                                className="text-[#5C636A] hover:text-[#1F845A] transition-colors cursor-pointer"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#1F845A]" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              <span className="hidden @xl:block text-xs text-[#5C636A] font-medium">{getTaskKey(task)}</span>

                              <button
                                onClick={() => openEditModal(task)}
                                title={task.title}
                                className="min-w-0 text-left cursor-pointer"
                              >
                                <p className={`text-sm font-medium truncate hover:underline ${task.completed ? 'line-through text-[#5C636A]' : ''}`}>
                                  {pinned && <Pin className="inline w-3.5 h-3.5 mr-1 text-[#D97706]" />}
                                  {urgent && <Flag className="inline w-3.5 h-3.5 mr-1 text-[#BF5700]" />}
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-[#5C636A] mt-0.5 truncate">{task.description}</p>
                                )}
                              </button>

                              <div className="hidden @xl:flex items-center gap-1 min-w-0 flex-wrap">
                                {pinned && (
                                  <span className="px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase bg-[#FEF3C7] text-[#B45309]">
                                    Pinned
                                  </span>
                                )}
                                {urgent && (
                                  <span className="px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase bg-[#FFEAD6] text-[#A34A00]">
                                    Urgent
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 h-5 rounded-sm text-[11px] font-bold uppercase ${
                                    task.completed
                                      ? 'bg-[#DCFFF1] text-[#216E4E]'
                                      : 'bg-[#E9ECEF] text-[#495057]'
                                  }`}
                                >
                                  {task.completed ? 'Done' : 'To do'}
                                </span>
                              </div>

                              <div className="flex items-center justify-end gap-1">
                                {!task.completed && (
                                  <>
                                    <button
                                      onClick={() => togglePinned(task)}
                                      title={pinned ? 'Unpin task' : 'Pin task to top'}
                                      className={`p-1.5 rounded cursor-pointer ${
                                        pinned ? 'text-[#B45309] bg-[#FEF3C7]' : 'text-[#495057] hover:bg-[#FEF3C7] hover:text-[#B45309]'
                                      }`}
                                    >
                                      <Pin className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => toggleUrgent(task)}
                                      title={urgent ? 'Remove urgent tag' : 'Mark as urgent'}
                                      className={`p-1.5 rounded cursor-pointer ${
                                        urgent ? 'text-[#A34A00] bg-[#FFEAD6]' : 'text-[#495057] hover:bg-[#FFEAD6] hover:text-[#A34A00]'
                                      }`}
                                    >
                                      <Flag className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => openEditModal(task)}
                                  aria-label="Edit task"
                                  className="p-1.5 rounded text-[#495057] hover:bg-[#21252914] cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setTaskToDelete(task)}
                                  aria-label="Delete task"
                                  className="p-1.5 rounded text-[#495057] hover:bg-[#FFECEB] hover:text-[#C9372C] cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {!isFirstLoad && (
                    <form
                      onSubmit={handleQuickAdd}
                      className="shrink-0 flex items-center gap-3 px-4 h-12 border-t border-[#DEE2E6] bg-[#F8F9FA] focus-within:bg-white"
                    >
                      <Plus className="w-5 h-5 text-[#5C636A] shrink-0" />
                      <input
                        type="text"
                        aria-label="Task summary"
                        placeholder="Create a task and press Enter"
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        className="flex-1 bg-transparent text-sm placeholder-[#5C636A] focus:outline-none"
                      />
                    </form>
                  )}
                </div>

                <section
                  aria-label="Daily tasks"
                  className={`${cardsSideBySide || mobilePanel === 'daily' ? 'flex' : 'hidden'} min-w-0 min-h-0 flex-col bg-white border border-[#DEE2E6] rounded-md overflow-hidden`}
                >
                  <div className="shrink-0 px-4 py-3 border-b border-[#DEE2E6] bg-[#F8F9FA]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Repeat className="w-4 h-4 text-[#495057] shrink-0" />
                        <h2 className="text-sm font-semibold truncate">Daily tasks</h2>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${allDailyDone ? 'text-[#216E4E]' : 'text-[#5C636A]'}`}>
                        {allDailyDone ? 'All done!' : `${dailyDoneCount}/${dailyTasks.length} today`}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C636A] mt-0.5">Repeats every day · {todayLabel}</p>
                    <div className="h-1.5 mt-2.5 rounded-full bg-[#E9ECEF] overflow-hidden">
                      <div
                        className="h-full bg-[#1F845A] transition-[width] duration-300"
                        style={{ width: dailyTasks.length ? `${(dailyDoneCount / dailyTasks.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {dailyTasks.length === 0 ? (
                      <div className="py-12 px-6 text-center">
                        <p className="font-semibold">No daily tasks yet</p>
                        <p className="text-sm text-[#5C636A] mt-1">
                          Add things you do every day, like reviewing emails or a morning stand-up.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#DEE2E6]">
                        {dailyTasks.map((daily) => {
                          const done = daily.lastCompleted === today;

                          return (
                            <li
                              key={daily.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors group"
                            >
                              <button
                                onClick={() => toggleDaily(daily)}
                                aria-label={done ? 'Mark as not done today' : 'Mark as done today'}
                                className="shrink-0 text-[#5C636A] hover:text-[#1F845A] transition-colors cursor-pointer"
                              >
                                {done ? (
                                  <CheckCircle2 className="w-5 h-5 text-[#1F845A]" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                              <span
                                title={daily.title}
                                className={`flex-1 min-w-0 truncate text-sm font-medium ${done ? 'line-through text-[#5C636A]' : ''}`}
                              >
                                {daily.title}
                              </span>
                              <button
                                onClick={() => deleteDaily(daily.id)}
                                aria-label="Remove daily task"
                                className="shrink-0 p-1.5 rounded text-[#495057] hover:bg-[#FFECEB] hover:text-[#C9372C] cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <form
                    onSubmit={handleAddDaily}
                    className="shrink-0 flex items-center gap-3 px-4 h-12 border-t border-[#DEE2E6] bg-[#F8F9FA] focus-within:bg-white"
                  >
                    <Plus className="w-5 h-5 text-[#5C636A] shrink-0" />
                    <input
                      type="text"
                      aria-label="Daily task summary"
                      placeholder="Add a daily task and press Enter"
                      value={dailyTitle}
                      onChange={(e) => setDailyTitle(e.target.value)}
                      className="flex-1 min-w-0 bg-transparent text-sm placeholder-[#5C636A] focus:outline-none"
                    />
                  </form>
                </section>
              </div>
            </main>

            {/* AI assistant bar (right side). Large screens: collapsible column like the left sidebar. Smaller screens: slide-over drawer. */}
            {isLargeScreen && !isChatOpen && (
              <aside
                aria-label="AI assistant (collapsed)"
                className="flex flex-col items-center gap-2 w-14 shrink-0 bg-[#BF5700] border-l border-black/10 py-3"
              >
                <button
                  onClick={() => setIsChatOpen(true)}
                  title="Open AI assistant"
                  aria-label="Open AI assistant"
                  className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-[#A34A00] transition-colors cursor-pointer"
                >
                  <PanelRightOpen className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center text-white" aria-hidden="true">
                  <Sparkles className="w-5 h-5" />
                </div>
              </aside>
            )}

            {isChatOpen && (
              <>
                {!isLargeScreen && (
                  <div
                    className="fixed inset-0 z-40 bg-[#2125298A]"
                    onClick={() => setIsChatOpen(false)}
                    aria-hidden="true"
                  />
                )}

                <aside
                  aria-label="AI assistant"
                  role={isLargeScreen ? undefined : 'dialog'}
                  aria-modal={isLargeScreen ? undefined : true}
                  className={
                    isLargeScreen
                      ? 'flex flex-col w-64 shrink-0 min-h-0 bg-[#BF5700] text-white border-l border-black/10'
                      : 'fixed inset-y-0 right-0 z-40 flex flex-col w-full max-w-sm bg-[#BF5700] text-white shadow-[-8px_0_16px_#21252933]'
                  }
                >
                  {/* Header */}
                  <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-white/20">
                    <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">AI Assistant</p>
                      <span className="inline-block mt-0.5 rounded-sm bg-white px-1.5 text-[10px] font-bold uppercase leading-4 text-[#A34A00]">
                        Preview
                      </span>
                    </div>
                    <button
                      onClick={resetChat}
                      title="New chat"
                      aria-label="Start a new chat"
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-[#A34A00] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      title={isLargeScreen ? 'Collapse assistant' : 'Close assistant'}
                      aria-label={isLargeScreen ? 'Collapse AI assistant' : 'Close AI assistant'}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-[#A34A00] transition-colors cursor-pointer"
                    >
                      {isLargeScreen ? <PanelRightClose className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Messages */}
                  <div
                    ref={chatScrollRef}
                    className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-4"
                    aria-live="polite"
                  >
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <p
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap wrap-break-words ${
                            msg.role === 'user'
                              ? 'bg-white text-[#212529] rounded-tr-sm'
                              : 'bg-[#A34A00] text-white rounded-tl-sm'
                          }`}
                        >
                          {msg.text}
                        </p>
                      </div>
                    ))}

                    {isAssistantTyping && (
                      <div className="flex gap-2" role="status" aria-label="The assistant is typing">
                        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-[#A34A00] px-3 py-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}

                    {/* Suggested prompts, shown until the first message is sent */}
                    {chatMessages.length === 1 && !isAssistantTyping && (
                      <div className="pt-1 space-y-2">
                        <p className="text-xs font-semibold">Try asking</p>
                        <div className="flex flex-wrap gap-2">
                          {CHAT_SUGGESTIONS.map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => sendChatMessage(suggestion)}
                              className="rounded-full border border-white/60 px-3 py-1.5 text-xs text-left hover:bg-[#A34A00] transition-colors cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="shrink-0 border-t border-white/20 p-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendChatMessage(chatInput);
                      }}
                      className="flex items-end gap-2 rounded-lg bg-white p-1.5"
                    >
                      <textarea
                        aria-label="Message the AI assistant"
                        rows={1}
                        placeholder="Ask anything..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          // Enter sends, Shift+Enter adds a new line
                          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            sendChatMessage(chatInput);
                          }
                        }}
                        className="flex-1 min-w-0 max-h-32 resize-none bg-transparent px-2 py-2 text-sm text-[#212529] placeholder-[#5C636A] focus:outline-none field-sizing-content"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isAssistantTyping}
                        aria-label="Send message"
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-[#212529] hover:bg-[#495057] text-white transition-colors cursor-pointer disabled:bg-[#2125290F] disabled:text-[#868E96] disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                    <p className="mt-2 text-[11px] leading-4">AI can make mistakes. Check important info.</p>
                  </div>
                </aside>
              </>
            )}
          </div>

          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 bg-[#2125298A]"
              onClick={closeModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={isEditing ? 'Edit task' : 'Create task'}
                className="bg-white rounded-md w-full max-w-lg shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                  <div>
                    {isEditing && <p className="text-xs text-[#5C636A] mb-0.5">{getTaskKey(currentTask)}</p>}
                    <h2 className="text-xl font-semibold">{isEditing ? 'Edit task' : 'Create task'}</h2>
                  </div>
                  <button
                    onClick={closeModal}
                    aria-label="Close"
                    className="p-1.5 rounded text-[#495057] hover:bg-[#2125290F] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} className="px-6 pb-5 space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-xs font-semibold text-[#495057] mb-1">
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
                      className="w-full h-10 bg-[#F8F9FA] border-2 border-[#DEE2E6] hover:bg-[#E9ECEF] rounded px-3 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-xs font-semibold text-[#495057] mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      placeholder="Add details about this task"
                      value={currentTask.description || ''}
                      onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                      className="w-full bg-[#F8F9FA] border-2 border-[#DEE2E6] hover:bg-[#E9ECEF] rounded px-3 py-2 text-sm placeholder-[#5C636A] focus:outline-none focus:border-[#212529] focus:bg-white resize-none"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="completed"
                        checked={currentTask.completed}
                        onChange={(e) => setCurrentTask({ ...currentTask, completed: e.target.checked })}
                        className="w-4 h-4 rounded-sm accent-[#212529] cursor-pointer"
                      />
                      <label htmlFor="completed" className="text-sm cursor-pointer">
                        Mark as completed
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pinned"
                        checked={currentTask.pinned || false}
                        onChange={(e) => setCurrentTask({ ...currentTask, pinned: e.target.checked })}
                        className="w-4 h-4 rounded-sm accent-[#D97706] cursor-pointer"
                      />
                      <label htmlFor="pinned" className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Pin className="w-3.5 h-3.5 text-[#D97706]" />
                        Pin task to the top
                        <span className="text-xs text-[#5C636A]">(shown above all tasks)</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="urgent"
                        checked={currentTask.urgent || false}
                        onChange={(e) => setCurrentTask({ ...currentTask, urgent: e.target.checked })}
                        className="w-4 h-4 rounded-sm accent-[#BF5700] cursor-pointer"
                      />
                      <label htmlFor="urgent" className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Flag className="w-3.5 h-3.5 text-[#BF5700]" />
                        Mark as urgent
                        <span className="text-xs text-[#5C636A]">(shown below pinned tasks)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || !currentTask.title.trim()}
                      className="h-9 px-3 rounded bg-[#212529] hover:bg-[#495057] text-white text-sm font-medium transition-colors cursor-pointer disabled:bg-[#2125290F] disabled:text-[#868E96] disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {taskToDelete && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-32 bg-[#2125298A]"
              onClick={() => setTaskToDelete(null)}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-label="Delete task"
                className="bg-white rounded-md w-full max-w-sm p-6 shadow-[0_8px_12px_#21252926,0_0_1px_#2125294F]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold">Delete {getTaskKey(taskToDelete)}?</h2>
                <p className="text-sm text-[#495057] mt-2 wrap-break-words">
                  "{taskToDelete.title}" will be permanently deleted. This can't be undone.
                </p>
                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    onClick={() => setTaskToDelete(null)}
                    autoFocus
                    className="h-9 px-3 rounded text-sm font-medium text-[#495057] hover:bg-[#2125290F] cursor-pointer"
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
        </div>
      )}

      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed right-4 ${toastPosition} z-60 flex items-start gap-2.5 w-max max-w-[calc(100vw-2rem)] sm:max-w-sm rounded px-4 py-3 text-sm font-medium text-white shadow-[0_8px_12px_#21252926] ${
            toast.type === 'error' ? 'bg-[#C9372C]' : 'bg-[#212529]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="shrink-0 -mr-1.5 p-0.5 rounded hover:bg-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}