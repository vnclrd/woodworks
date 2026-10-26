import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';
import { BASE_URL } from '../../config/appConfig';

export default function VerifyEmailScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double-fetching in React StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    fetch(`${BASE_URL.replace(/\/$/, '')}/api/auth/verify?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed.');
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now sign in.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification token.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-[#DEE2E6] text-center">
        <div className="flex justify-center mb-4">
          {status === 'loading' && <RefreshCw className="w-12 h-12 text-[#212529] animate-spin" />}
          {status === 'success' && <CheckCircle2 className="w-12 h-12 text-[#216E4E]" />}
          {status === 'error' && <AlertTriangle className="w-12 h-12 text-[#AE2E24]" />}
        </div>

        <h1 className="text-2xl font-semibold text-[#212529]">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="text-sm text-[#5C636A] mt-2 mb-6">{message}</p>

        {status !== 'loading' && (
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-11 bg-[#212529] hover:bg-[#495057] text-white rounded text-sm font-medium transition-colors"
          >
            Go to Sign In <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}