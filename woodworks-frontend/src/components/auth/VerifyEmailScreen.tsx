import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BASE_URL } from '../../config/appConfig';

export default function VerifyEmailScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
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
        setMessage(
          data.message || 'Email verified successfully! You can now sign in.',
        );
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification token.');
      });
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center bg-subtle px-6'>
      <div className='w-full max-w-md bg-surface p-8 rounded-lg shadow-sm border border-line text-center'>
        <div className='flex justify-center mb-4'>
          {status === 'loading' && (
            <RefreshCw className='w-12 h-12 text-fg animate-spin' />
          )}
          {status === 'success' && (
            <CheckCircle2 className='w-12 h-12 text-ok' />
          )}
          {status === 'error' && (
            <AlertTriangle className='w-12 h-12 text-danger' />
          )}
        </div>

        <h1 className='text-2xl font-semibold text-fg'>
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className='text-sm text-fg-3 mt-2 mb-6'>{message}</p>

        {status !== 'loading' && (
          <a
            href='/'
            className='inline-flex items-center justify-center gap-2 w-full h-11 bg-primary hover:bg-primary-hover text-white rounded text-sm font-medium transition-colors'
          >
            Go to Sign In <ArrowRight className='w-4 h-4' />
          </a>
        )}
      </div>
    </div>
  );
}
