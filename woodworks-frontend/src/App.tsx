import { useEffect, useState } from 'react';
import AuthScreen from './components/auth/AuthScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
import VerifyEmailScreen from './components/auth/VerifyEmailScreen';
import GuideTour from './components/guide/GuideTour';
import AppHeader from './components/layout/AppHeader';
import RightSidebar from './components/layout/RightSidebar';
import Sidebar from './components/layout/Sidebar';
import AccountManagerModal from './components/modals/AccountManagerModal';
import DeleteAccountConfirmModal from './components/modals/DeleteAccountConfirmModal';
import GroupModal from './components/modals/GroupModal';
import TaskDeleteModal from './components/modals/TaskDeleteModal';
import TaskModal from './components/modals/TaskModal';
import MainContent from './components/tasks/MainContent';
import ToastMessage from './components/ui/ToastMessage';
import { useAppController } from './hooks/useAppController';

export default function App() {
  const app = useAppController();

  const GUIDE_PENDING = 'woodworks_guide_pending';
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (app.isAuthScreen || app.isFirstLoad) return;
    if (localStorage.getItem(GUIDE_PENDING) === '1') setShowGuide(true);
  }, [app.isAuthScreen, app.isFirstLoad]);

  const closeGuide = () => {
    localStorage.removeItem(GUIDE_PENDING);
    setShowGuide(false);
  };

  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('token');

  if (window.location.pathname === '/verify-email') {
    return <VerifyEmailScreen />;
  }

  if (window.location.pathname === '/reset-password' && resetToken) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        onSuccess={() => (window.location.href = '/')}
      />
    );
  }

  return (
    <>
      {app.isAuthScreen ? (
        <AuthScreen app={app} />
      ) : (
        <div className='h-dvh flex flex-col overflow-hidden bg-page text-fg'>
          {app.isDemoMode && (
            <div className='shrink-0 bg-chip border-b border-line px-4 py-2 text-xs text-fg flex items-center justify-between gap-3 font-medium'>
              <span className='hidden sm:inline'>
                💡 <strong>Demo Mode:</strong> You are testing an interactive
                sandbox. Changes won't affect live production data.
              </span>
              <span className='sm:hidden'>
                💡 <strong>Demo mode:</strong> changes won't affect live data.
              </span>
            </div>
          )}

          <AppHeader app={app} />
          <div className='flex flex-1 min-h-0'>
            <Sidebar app={app} onStartGuide={() => setShowGuide(true)} />
            <MainContent app={app} />
            <RightSidebar app={app} />
          </div>

          <TaskModal app={app} />
          <GroupModal app={app} />
          <AccountManagerModal app={app} />
          <DeleteAccountConfirmModal app={app} />
          <TaskDeleteModal app={app} />
          {showGuide && <GuideTour onClose={closeGuide} />}
        </div>
      )}
      <ToastMessage app={app} />
    </>
  );
}
