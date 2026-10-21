import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function ToastMessage({ app }: Props) {
  const { toast, toastPosition, setToast } = app;
  return (
    <>
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed ${toastPosition} z-60 flex items-start gap-2.5 w-max max-w-[calc(100vw-2rem)] sm:max-w-sm rounded px-4 py-3 text-sm font-medium text-white shadow-[0_8px_12px_#21252926] ${
            toast.type === 'error' ? 'bg-[#C9372C]' : 'bg-[#212529]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
          ) : (
            <CheckCircle2 className='w-4 h-4 mt-0.5 shrink-0' />
          )}
          <span className='flex-1'>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            aria-label='Dismiss notification'
            className='shrink-0 -mr-1.5 p-0.5 rounded hover:bg-white/20 cursor-pointer'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      )}
    </>
  );
}
