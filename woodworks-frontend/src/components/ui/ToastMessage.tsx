import { AlertTriangle, CheckCircle2, Trash2, X } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function ToastMessage({ app }: Props) {
  const { toast, toastPosition, setToast } = app;

  // Map toast types to complementary background colors
  const getToastStyle = (type?: string) => {
    switch (type) {
      case 'error':
        return 'bg-[#C9372C]'; // Red for errors
      case 'completion':
        return 'bg-[#1F845A]'; // Green (complementary for success/completion)
      case 'deletion':
        return 'bg-[#991B1B]'; // Dark crimson (complementary for deletion)
      default:
        return 'bg-[#212529]'; // Default dark
    }
  };

  const getToastIcon = (type?: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />;
      case 'completion':
        return <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />;
      case 'deletion':
        return <Trash2 className="w-4 h-4 mt-0.5 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />;
    }
  };

  return (
    <>
      {toast && (
        <div
          role={toast.type === 'error' || toast.type === 'deletion' ? 'alert' : 'status'}
          className={`fixed ${toastPosition} transition-all duration-300 motion-reduce:transition-none z-60 flex items-start gap-2.5 w-max max-w-[calc(100vw-2rem)] sm:max-w-sm rounded px-4 py-3 text-sm font-medium text-white shadow-[0_8px_12px_#21252926] ${getToastStyle(
            toast.type
          )}`}
        >
          {getToastIcon(toast.type)}
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