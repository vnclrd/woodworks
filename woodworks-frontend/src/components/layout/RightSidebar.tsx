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

interface RightSidebarProps {
  app?: any;
}

export default function RightSidebar({ app: _app }: RightSidebarProps) {
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
          {activeTab === 0 && <div className="space-y-2"><h3 className="font-semibold">Task Inspector</h3><p className="text-sm text-amber-100/70">Select a task to view details.</p></div>}
          {activeTab === 1 && <div className="space-y-2"><h3 className="font-semibold">Productivity Timer</h3><p className="text-sm text-amber-100/70">Pomodoro & time tracking controls here.</p></div>}
          {activeTab === 2 && <div className="space-y-2"><h3 className="font-semibold">Scratchpad</h3><textarea className="w-full h-40 bg-amber-900/50 p-2 rounded text-sm text-white resize-none border border-amber-700" placeholder="Jot down notes..."></textarea></div>}
          {activeTab === 3 && <div className="space-y-2"><h3 className="font-semibold">Activity Stream</h3><p className="text-sm text-amber-100/70">Recent updates and notifications.</p></div>}
          {activeTab === 4 && <div className="space-y-2"><h3 className="font-semibold">Quick Filters</h3><p className="text-sm text-amber-100/70">Filter tasks by priority, tags, status.</p></div>}
        </div>
      )}
    </aside>
  );
}