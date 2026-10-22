import { useState } from 'react';
import { 
  FileText, 
  Timer, 
  StickyNote, 
  Activity, 
  ListFilter, 
  PanelRightClose, 
  PanelRightOpen 
} from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

interface RightSidebarProps {
  app: AppController;
}

export default function RightSidebar({ app }: RightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Inspector', icon: FileText },
    { id: 1, label: 'Timer', icon: Timer },
    { id: 2, label: 'Notes', icon: StickyNote },
    { id: 3, label: 'Activity', icon: Activity },
    { id: 4, label: 'Filters', icon: ListFilter },
  ];

  return (
    <aside className={`h-full bg-amber-800 text-white transition-all duration-300 flex flex-col ${isCollapsed ? 'w-16' : 'w-80'}`}>
      
      {/* HEADER / TAB BAR */}
      {isCollapsed ? (
        // Collapsed View (Vertical Stack)
        <div className="flex flex-col items-center py-4 space-y-4 flex-1">
          <button 
            onClick={() => setIsCollapsed(false)} 
            className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
            title="Expand Sidebar"
          >
            <PanelRightOpen size={20} />
          </button>
          <hr className="w-8 border-amber-700 my-2" />
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(idx); setIsCollapsed(false); }}
                className={`p-3 rounded-xl transition-all ${activeTab === idx ? 'bg-amber-950 shadow-inner' : 'hover:bg-amber-700'}`}
                title={tab.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      ) : (
        // Expanded View (Horizontal Top Bar)
        <div className="flex items-center justify-between p-3 border-b border-amber-700/50">
          <div className="flex space-x-1">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`p-2.5 rounded-lg transition-all ${activeTab === idx ? 'bg-amber-950 shadow-inner' : 'hover:bg-amber-700'}`}
                  title={tab.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
            title="Collapse Sidebar"
          >
            <PanelRightClose size={20} />
          </button>
        </div>
      )}

      {/* DYNAMIC CONTENT AREA (Only visible when expanded) */}
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-700/50 pb-2">
                <h3 className="font-semibold text-amber-100">Task Inspector</h3>
                <span className="text-xs text-amber-300 bg-amber-950 px-2 py-0.5 rounded">
                  {app.activeTask ? app.getTaskKey(app.activeTask) : 'No Selection'}
                </span>
              </div>

              {app.activeTask ? (() => {
                const task = app.activeTask;
                return (
                  <div className="space-y-3">
                    {/* Task Title Input */}
                    <div>
                      <label className="text-xs text-amber-200 block mb-1">Title</label>
                      <input 
                        type="text"
                        value={task.title}
                        onChange={(e) => {
                          const updated = { ...task, title: e.target.value };
                          app.setTasks(app.tasks.map((t) => t.id === updated.id ? updated : t));
                        }}
                        onBlur={() => app.updateTaskBackend(task)}
                        className="w-full bg-amber-900/50 border border-amber-700 rounded p-2 text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    {/* Task Description Input */}
                    <div>
                      <label className="text-xs text-amber-200 block mb-1">Description</label>
                      <textarea 
                        rows={4}
                        value={task.description || ''}
                        onChange={(e) => {
                          const updated = { ...task, description: e.target.value };
                          app.setTasks(app.tasks.map((t) => t.id === updated.id ? updated : t));
                        }}
                        onBlur={() => app.updateTaskBackend(task)}
                        className="w-full bg-amber-900/50 border border-amber-700 rounded p-2 text-sm text-white resize-none focus:outline-none focus:border-white"
                        placeholder="Add a detailed description..."
                      />
                    </div>

                    {/* Quick Toggles (Urgent / Pinned) */}
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!task.urgent}
                          onChange={() => app.toggleUrgent(task)}
                          className="rounded bg-amber-900 border-amber-700 text-amber-600 focus:ring-0"
                        />
                        <span>Mark Urgent</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!task.pinned}
                          onChange={() => app.togglePinned(task)}
                          className="rounded bg-amber-900 border-amber-700 text-amber-600 focus:ring-0"
                        />
                        <span>Pin to Top</span>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 flex items-center justify-between border-t border-amber-700/50">
                      <button
                        onClick={() => {
                          app.handleDeleteTask(task.id);
                          app.setActiveTaskId(null);
                        }}
                        className="text-xs text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                      >
                        Delete Task
                      </button>
                      <button
                        onClick={() => app.setActiveTaskId(null)}
                        className="text-xs bg-amber-950 hover:bg-amber-900 text-amber-100 px-3 py-1.5 rounded transition-colors cursor-pointer"
                      >
                        Close Inspector
                      </button>
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-12 text-amber-200/70 space-y-2">
                  <p className="text-sm">No task selected.</p>
                  <p className="text-xs text-amber-300/50">Click on any task card in your main workspace to inspect and edit it here.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 1 && <div className="space-y-2"><h3 className="font-semibold">Productivity Timer</h3><p className="text-sm text-amber-100/70">Pomodoro & time tracking controls here.</p></div>}
          {activeTab === 2 && <div className="space-y-2"><h3 className="font-semibold">Scratchpad</h3><textarea className="w-full h-40 bg-amber-900/50 p-2 rounded text-sm text-white resize-none border border-amber-700" placeholder="Jot down notes..."></textarea></div>}
          {activeTab === 3 && <div className="space-y-2"><h3 className="font-semibold">Activity Stream</h3><p className="text-sm text-amber-100/70">Recent updates and notifications.</p></div>}
          {activeTab === 4 && <div className="space-y-2"><h3 className="font-semibold">Quick Filters</h3><p className="text-sm text-amber-100/70">Filter tasks by priority, tags, status.</p></div>}
        </div>
      )}
    </aside>
  );
}