import { useState } from 'react';
import { Lock, RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
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
      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
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
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-[#DEE2E6]">
        <div className="flex items-center gap-2.5 mb-6">
          <img src="/WoodWorksLogo.png" alt="WoodWorks Logo" className="w-9 h-9 rounded-2xl object-contain shadow-sm" />
          <span className="font-semibold text-lg text-[#212529]">WoodWorks</span>
        </div>

        {isSuccess ? (
          <div className="text-center py-2">
            <div className="flex justify-center mb-4 text-[#216E4E]">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-semibold text-[#212529]">Password reset</h1>
            <p className="text-sm text-[#5C636A] mt-2 mb-6">Your password has been successfully updated.</p>
            <button
              onClick={onSuccess}
              className="w-full h-11 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors cursor-pointer"
            >
              Sign in with new password
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-[#212529]">Set new password</h1>
            <p className="text-sm text-[#5C636A] mt-1.5 mb-6">Please enter your new password below.</p>

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2.5 p-3 bg-[#FFECEB] border border-[#C9372C33] text-[#AE2E24] text-sm rounded">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-10 px-3 pr-10 text-sm border border-[#DEE2E6] rounded focus:outline-none focus:border-[#212529]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#5C636A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#495057] mb-1">Confirm new password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-10 px-3 text-sm border border-[#DEE2E6] rounded focus:outline-none focus:border-[#212529]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}