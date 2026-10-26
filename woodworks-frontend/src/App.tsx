import AuthScreen from './components/auth/AuthScreen';
import VerifyEmailScreen from './components/auth/VerifyEmailScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';
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

  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('token');

  if (window.location.pathname === '/verify-email') {
    return <VerifyEmailScreen />;
  }

  if (window.location.pathname === '/reset-password' && resetToken) {
    return <ResetPasswordScreen token={resetToken} onSuccess={() => window.location.href = '/'} />;
  }

  return (
    <>
      {app.isAuthScreen ? (
        <AuthScreen app={app} />
      ) : (
        <div className="h-dvh flex flex-col overflow-hidden bg-[#F8F9FA] text-[#212529]">
          {app.isDemoMode && (
            <div className="shrink-0 bg-[#E9ECEF] border-b border-[#DEE2E6] px-4 py-2 text-xs text-[#212529] flex items-center justify-between gap-3 font-medium">
              <span>💡 <strong>Demo Mode:</strong> You are testing an interactive sandbox. Changes won't affect live production data.</span>
              <a href="https://github.com/vnclrd/woodworks" target="_blank" rel="noreferrer" className="shrink-0 underline hover:text-[#495057]">View Source</a>
            </div>
          )}

          <AppHeader app={app} />
          <div className="flex flex-1 min-h-0">
            <Sidebar app={app} />
            <MainContent app={app} />
            <RightSidebar app={app} />
          </div>

          <TaskModal app={app} />
          <GroupModal app={app} />
          <AccountManagerModal app={app} />
          <DeleteAccountConfirmModal app={app} />
          <TaskDeleteModal app={app} />
        </div>
      )}
      <ToastMessage app={app} />
    </>
  );
}