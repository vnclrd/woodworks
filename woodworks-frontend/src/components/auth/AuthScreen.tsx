import { useState } from 'react';
import { ListTodo, Search, CheckSquare, AlertTriangle, EyeOff, Eye, RefreshCw, ArrowLeft } from 'lucide-react';
import type { AppController } from '../../hooks/useAppController';

type Props = { app: AppController };

export default function AuthScreen({ app }: Props) {
  const { authView, authError, handleAuthSubmit, emailInput, setEmailInput, authInputClass, showPassword, setShowPassword, passwordInput, setPasswordInput, confirmPasswordInput, setConfirmPasswordInput, rememberMe, setRememberMe, isAuthLoading, switchAuthView } = app;
  
  // Local sub-view state for forgot password screen
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingForgot(true);
    setForgotMessage('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setForgotMessage(data.message || 'If an account exists, a reset link has been sent.');
    } catch {
      setForgotMessage('Failed to send reset email. Please try again.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
      <div className="hidden lg:flex flex-col justify-between bg-[#212529] text-white p-12">
        <div className="flex items-center gap-2.5">
          <img src="/WoodWorksLogo.png" alt="WoodWorks Logo" className="w-10 h-10 rounded-2xl object-contain shadow-sm" />
          <span className="font-semibold text-lg">WoodWorks</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Keep every task moving.<br />
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
            <img src="/WoodWorksLogo.png" alt="WoodWorks Logo" className="w-10 h-10 rounded-2xl object-contain shadow-sm" />
            <span className="font-semibold text-lg">WoodWorks</span>
          </div>

          {isForgotPassword ? (
            <div>
              <button
                onClick={() => { setIsForgotPassword(false); setForgotMessage(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C636A] hover:text-[#212529] mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </button>
              <h1 className="text-2xl font-semibold text-[#212529]">Reset your password</h1>
              <p className="text-sm text-[#5C636A] mt-1.5">Enter your email address and we'll send you a link to reset your password.</p>

              {forgotMessage && (
                <div role="status" className="mt-5 p-3 bg-[#DCFFF1] border border-[#216E4E33] text-[#216E4E] text-sm rounded">
                  <span>{forgotMessage}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#495057] mb-1">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoFocus
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={authInputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingForgot}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSendingForgot && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isSendingForgot ? 'Sending link...' : 'Send reset link'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#212529]">
                {authView === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-[#5C636A] mt-1.5">
                {authView === 'login' ? 'Sign in to manage your tasks.' : 'Sign up to start organizing your tasks.'}
              </p>

              {authError && (
                <div role="alert" className="mt-5 flex items-start gap-2.5 p-3 bg-[#FFECEB] border border-[#C9372C33] text-[#AE2E24] text-sm rounded">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-[#495057] mb-1">Email</label>
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
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-[#495057]">Password</label>
                    {authView === 'login' && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-medium text-[#BF5700] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
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
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded text-[#5C636A] hover:bg-[#2125290F] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authView === 'register' && (
                  <div>
                    <label htmlFor="auth-confirm" className="block text-xs font-semibold text-[#495057] mb-1">Confirm password</label>
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
                  <label htmlFor="auth-remember" className="flex items-center gap-2 w-fit text-sm text-[#495057] cursor-pointer select-none">
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
                  className="w-full h-11 flex items-center justify-center gap-2 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isAuthLoading ? (authView === 'login' ? 'Signing in...' : 'Creating account...') : (authView === 'login' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[#5C636A]">
                {authView === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button onClick={() => switchAuthView('register')} className="text-[#212529] font-semibold hover:underline cursor-pointer">Sign up</button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => switchAuthView('login')} className="text-[#212529] font-semibold hover:underline cursor-pointer">Sign in</button>
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-[#DEE2E6] text-center">
            <a href="?demo=true" className="inline-flex items-center justify-center w-full h-10 rounded border border-[#DEE2E6] bg-white text-sm font-medium text-[#495057] hover:bg-[#2125290F] transition-colors">
              Try the demo without an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}