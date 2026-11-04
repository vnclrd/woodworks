import { BarChart2, Lock } from 'lucide-react';
import { isFreeRole } from '../../config/plans';
import type { AppController } from '../../hooks/useAppController';

type Props = {
  app: AppController;
};

// Helper to get past 7 days keys (YYYY-MM-DD)
const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return days;
};

export default function ProductivityAnalytics({ app }: Props) {
  const locked = !app.isDemoMode && isFreeRole(app.userRole);

  if (locked) {
    return (
      <div className="space-y-4 text-white">
        <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
          <h3 className="font-semibold">Weekly Analytics</h3>
          <span className="text-xs">Locked</span>
        </div>
        <div className="rounded-md bg-[#914000] px-4 py-10 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
            <Lock size={22} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Weekly Analytics is a Premium Feature</h3>
            <p className="text-xs leading-5 text-[#FFE8D1] mt-1">
              Unlock detailed insights into your weekly focus hours, peak productivity days, and task completion velocity.
            </p>
          </div>
          <span className="inline-block rounded-sm bg-white px-1.5 text-[10px] font-bold uppercase leading-4 text-[#914000]">
            Premium
          </span>
        </div>
        <button
          type="button"
          onClick={() => app.setIsPlansModalOpen(true)}
          className="w-full h-10 rounded bg-white text-[#914000] font-semibold text-sm hover:bg-[#FFE8D1] transition-colors cursor-pointer"
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  const weekDays = getLast7Days();
  let history: Record<string, number> = {};
  try {
    history = JSON.parse(localStorage.getItem('woodworks_weekly_pomodoro_history') || '{}');
  } catch {}

  const totalSessionsWeek = weekDays.reduce((acc, d) => acc + (history[d] || 0), 0);
  const totalMinutesWeek = totalSessionsWeek * 25;
  const completedTasksCount = app.tasks.filter((t) => t.completed).length;
  const maxSessions = Math.max(1, ...weekDays.map((d) => history[d] || 0));

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between gap-2 border-b border-white/20 pb-3">
        <h3 className="font-semibold">Weekly Analytics</h3>
        <span className="text-xs">Last 7 Days</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded bg-[#914000] p-3">
          <p className="text-[11px] text-[#FFE8D1]">Total Focus Time</p>
          <p className="text-lg font-bold">
            {totalMinutesWeek >= 60 ? `${(totalMinutesWeek / 60).toFixed(1)} hrs` : `${totalMinutesWeek} mins`}
          </p>
        </div>
        <div className="rounded bg-[#914000] p-3">
          <p className="text-[11px] text-[#FFE8D1]">Tasks Completed</p>
          <p className="text-lg font-bold">{completedTasksCount}</p>
        </div>
      </div>

      {/* Focus Distribution Bar Chart */}
      <div className="rounded bg-[#914000] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Focus Distribution</p>
          <span className="text-[11px] text-[#FFE8D1]">{totalSessionsWeek} total sessions</span>
        </div>
        <div className="flex items-end justify-between h-32 pt-4 px-1 border-b border-white/20">
          {weekDays.map((dateStr) => {
            const sessions = history[dateStr] || 0;
            const heightPercent = Math.max(12, Math.round((sessions / maxSessions) * 100));
            const dayLabel = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'narrow' });

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] text-white font-mono">{sessions > 0 ? sessions : ''}</span>
                <div className="w-full max-w-5.5 bg-white/20 rounded-t overflow-hidden h-full flex items-end">
                  <div
                    className="w-full bg-white transition-all duration-500 rounded-t"
                    style={{ height: sessions > 0 ? `${heightPercent}%` : '4%' }}
                    title={`${sessions} sessions (${sessions * 25} mins)`}
                  />
                </div>
                <span className="text-[10px] text-[#FFE8D1] font-medium">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Productivity Insights Card */}
      <div className="rounded bg-[#914000] p-3 space-y-1">
        <p className="text-xs font-semibold">Productivity Insights</p>
        <p className="text-xs text-[#FFE8D1] leading-relaxed">
          {totalSessionsWeek === 0
            ? 'Complete your first focus session today to start building your weekly momentum!'
            : `You've maintained steady focus across the week. Keep up the great pace!`}
        </p>
      </div>
    </div>
  );
}