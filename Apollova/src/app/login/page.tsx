"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      
      if (data.authenticated) {
        // Already logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleYouTubeLogin = () => {
    window.location.href = '/api/auth/youtube/authorise';
  };

  const handleTikTokLogin = () => {
    window.location.href = '/api/auth/tiktok/authorise';
  };

  if (checking) {
    return (
      <main className="login-page">
        <div className="login-container">
          <div className="checking">Checking authentication...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🎥 Apollova</h1>
          <h2>Video Publisher</h2>
          <p>Connect your accounts to start publishing videos</p>
        </div>

        <div className="login-buttons">
          <button 
            className="login-btn youtube-btn"
            onClick={handleYouTubeLogin}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>Connect with YouTube</span>
          </button>

          <button 
            className="login-btn tiktok-btn"
            onClick={handleTikTokLogin}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <span>Connect with TikTok</span>
          </button>
        </div>

        <div className="login-info">
          <p>
            <strong>Note:</strong> You need to connect at least one platform to access the dashboard.
          </p>
          <p className="tiktok-note">
            TikTok integration requires API approval (may take 1-3 days).
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          padding: 20px;
        }

        .login-container {
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-header h2 {
          font-size: 24px;
          color: #fff;
          margin-bottom: 12px;
        }

        .login-header p {
          color: #888;
          font-size: 14px;
        }

        .login-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .youtube-btn {
          background: #FF0000;
          color: white;
        }

        .youtube-btn:hover {
          background: #cc0000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
        }

        .tiktok-btn {
          background: #000000;
          color: white;
          border: 1px solid #69C9D0;
        }

        .tiktok-btn:hover {
          background: #69C9D0;
          color: #000;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(105, 201, 208, 0.3);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-info {
          text-align: center;
          font-size: 13px;
          color: #666;
          border-top: 1px solid #333;
          padding-top: 24px;
        }

        .login-info p {
          margin-bottom: 12px;
        }

        .login-info strong {
          color: #888;
        }

        .tiktok-note {
          color: #69C9D0;
          font-size: 12px;
        }

        .checking {
          text-align: center;
          padding: 40px;
          color: #888;
        }
      `}</style>
    </main>
  );
}