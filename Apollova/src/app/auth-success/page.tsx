"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '500px',
        padding: '40px',
        background: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #333'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅</h1>
        <h2 style={{ marginBottom: '20px' }}>
          {platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : 'Platform'} Connected!
        </h2>
        <p style={{ color: '#888', marginBottom: '30px' }}>
          Your account has been successfully connected and authorized.
          You can now publish videos to {platform === 'youtube' ? 'YouTube' : platform === 'tiktok' ? 'TikTok' : 'the platform'}.
        </p>
        <p style={{ color: '#666' }}>
          Redirecting to dashboard in {countdown} seconds...
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Go to Dashboard Now
        </button>
      </div>
    </main>
  );
}

export default function AuthSuccess() {
  return (
    <Suspense fallback={
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div>Loading...</div>
      </main>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}