// components/guide/guideSteps.ts
//
// One entry per tool/feature. `target` matches a `data-guide="..."` attribute in the UI.
// Steps whose target is missing or hidden (e.g. the left sidebar on mobile) are skipped automatically.

export type GuideStep = {
  id: string;
  target?: string; // omit for a centered "welcome / finish" bubble
  title: string;
  body: string;
  onEnter?: () => void; // runs when the step is shown (e.g. switch a sidebar tab)
};

// Clicks an element by its data-guide attribute (used to switch the right sidebar tabs)
const clickTarget = (target: string) => () => {
  (document.querySelector(`[data-guide="${target}"]`) as HTMLElement | null)?.click();
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to WoodWorks 👋',
    body: "Let's take a quick tour of the tools you'll use to manage your tasks. It only takes a minute, and you can skip it anytime.",
  },

  // ───────── Header ─────────
  {
    id: 'search',
    target: 'header-search',
    title: 'Search tasks',
    body: 'Type here to instantly filter your tasks by title or description. It works together with the filters and groups you select.',
  },
  {
    id: 'sort',
    target: 'header-sort',
    title: 'Sort order',
    body: 'Switch between seeing your newest or oldest tasks first, based on when they were created.',
  },
  {
    id: 'refresh',
    target: 'header-refresh',
    title: 'Refresh',
    body: 'Reload your tasks and daily tasks from the server. Handy if you changed something on another device.',
  },
  {
    id: 'create',
    target: 'header-create',
    title: 'Create a task',
    body: 'Opens the full task form, where you can set a title, description, group and more. For quick entries, use the quick-add bar below.',
  },
  {
    id: 'logout',
    target: 'header-logout',
    title: 'Logout',
    body: 'Sign out of your account when you are done, especially on shared computers.',
  },

  // ───────── Left sidebar ─────────
  {
    id: 'filters',
    target: 'sidebar-filters',
    title: 'Task views',
    body: 'Jump between views such as All, Pending, Urgent and Done. The number beside each view shows how many tasks are inside it.',
  },
  {
    id: 'groups',
    target: 'sidebar-groups',
    title: 'Groups',
    body: 'Use the folder button to create a group (like "School" or "Work"). Your groups are listed below it. Click one to see only its tasks.',
  },
  {
    id: 'progress',
    target: 'sidebar-progress',
    title: 'Progress',
    body: 'A quick look at how many of your tasks are done. The bar fills up as you complete them.',
  },
  {
    id: 'account',
    target: 'sidebar-account',
    title: 'Account Manager',
    body: 'Change your password or delete your account here.',
  },

  // ───────── Main content ─────────
  {
    id: 'tasks',
    target: 'tasks-card',
    title: 'Your tasks',
    body: 'All of your tasks live here. Click the circle to mark one as done, or click a title to open it in the Task Inspector on the right.',
  },
  {
    id: 'task-actions',
    target: 'task-actions',
    title: 'Task actions',
    body: 'Pin a task to keep it at the top, flag it as Urgent, edit it, or delete it. These buttons appear on every task row.',
  },
  {
    id: 'quick-add',
    target: 'quick-add',
    title: 'Quick add',
    body: 'Type a summary and press Enter to create a task in seconds. This bar stays visible while you scroll your list.',
  },
  {
    id: 'mic',
    target: 'quick-mic',
    title: 'Voice input',
    body: 'Prefer talking over typing? Tap the microphone and say your task summary.',
  },
  {
    id: 'daily',
    target: 'daily-card',
    title: 'Daily tasks',
    body: 'Habits and chores that repeat every day. Check them off as you go, and add new ones from the box at the bottom of this card.',
  },

  // ───────── Right sidebar (Workspace tools) ─────────
  {
    id: 'tab-inspector',
    target: 'tab-0',
    title: 'Workspace tools: Inspector',
    body: 'Select a task to view and edit its title and description, pin it, mark it urgent, copy its key, or delete it.',
    onEnter: clickTarget('tab-0'),
  },
  {
    id: 'tab-timer',
    target: 'tab-1',
    title: 'Workspace tools: Timer',
    body: 'A Pomodoro-style focus timer with short and long breaks. It keeps running while you switch tabs, and the countdown shows right here.',
    onEnter: clickTarget('tab-1'),
  },
  {
    id: 'tab-notes',
    target: 'tab-2',
    title: 'Workspace tools: Notes',
    body: 'A scratchpad for quick thoughts. Your notes are kept between visits, and you can copy or clear them anytime.',
    onEnter: clickTarget('tab-2'),
  },
  {
    id: 'tab-activity',
    target: 'tab-3',
    title: 'Workspace tools: Activity',
    body: 'A running log of your recent actions, like creating, completing or deleting tasks.',
    onEnter: clickTarget('tab-3'),
  },
  {
    id: 'tab-filters',
    target: 'tab-4',
    title: 'Workspace tools: Filters',
    body: 'Narrow your list to pinned tasks, urgent tasks, tasks with descriptions, or hide completed ones. A number on the tab shows how many filters are on.',
    onEnter: clickTarget('tab-4'),
  },

  {
    id: 'finish',
    title: "You're all set! 🎉",
    body: 'Start by adding your first task in the quick-add bar. You can replay this guide anytime from the sidebar.',
    onEnter: clickTarget('tab-0'),
  },
];