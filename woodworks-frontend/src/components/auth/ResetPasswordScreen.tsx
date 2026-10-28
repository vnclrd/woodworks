import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { BASE_URL } from '../../config/appConfig';

type Props = {
  token: string;
  onSuccess: () => void;
};

export default function ResetPasswordScreen({ token, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${BASE_URL.replace(/\/$/, '')}/api/auth/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-subtle px-6'>
      <div className='w-full max-w-sm bg-surface p-8 rounded-xl shadow-sm border border-line'>
        <div className='flex items-center gap-2.5 mb-6'>
          <img
            src='/WoodWorksLogo.png'
            alt='WoodWorks Logo'
            className='w-9 h-9 rounded-2xl object-contain shadow-sm'
          />
          <span className='font-semibold text-lg text-fg'>WoodWorks</span>
        </div>

        {isSuccess ? (
          <div className='text-center py-2'>
            <div className='flex justify-center mb-4 text-ok'>
              <CheckCircle2 className='w-12 h-12' />
            </div>
            <h1 className='text-2xl font-semibold text-fg'>Password reset</h1>
            <p className='text-sm text-fg-3 mt-2 mb-6'>
              Your password has been successfully updated.
            </p>
            <button
              onClick={onSuccess}
              className='w-full h-11 bg-primary hover:bg-primary-hover text-white rounded text-sm font-medium transition-colors cursor-pointer'
            >
              Sign in with new password
            </button>
          </div>
        ) : (
          <div>
            <h1 className='text-2xl font-semibold text-fg'>Set new password</h1>
            <p className='text-sm text-fg-3 mt-1.5 mb-6'>
              Please enter your new password below.
            </p>

            {error && (
              <div
                role='alert'
                className='mb-4 flex items-start gap-2.5 p-3 bg-danger-bg border border-[#C9372C33] text-danger text-sm rounded'
              >
                <AlertTriangle className='w-4 h-4 mt-0.5 shrink-0' />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-fg-2 mb-1'>
                  New password
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Enter new password'
                    className='w-full h-10 px-3 pr-10 text-sm border border-line rounded focus:outline-none focus:border-fg'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((prev) => !prev)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-fg-3'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-fg-2 mb-1'>
                  Confirm new password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Re-enter new password'
                  className='w-full h-10 px-3 text-sm border border-line rounded focus:outline-none focus:border-fg'
                />
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50'
              >
                {isLoading && <RefreshCw className='w-4 h-4 animate-spin' />}
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
