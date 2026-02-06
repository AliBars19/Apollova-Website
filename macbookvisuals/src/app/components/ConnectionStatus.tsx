"use client";

import { useEffect, useState } from 'react';

interface AccountStatus {
  youtube: boolean;
  tiktok: boolean;
  youtubeName?: string;
  tiktokName?: string;
}

interface AuthStatus {
  authenticated: boolean;
  accounts: {
    aurora: AccountStatus;
    nova: AccountStatus;
  };
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const accounts = [
    { id: 'aurora', label: 'Aurora', color: '#8B5CF6' },
    { id: 'nova', label: 'Nova', color: '#F59E0B' },
  ] as const;

  return (
    <div style={{
      padding: '16px',
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      <h3 style={{ 
        fontSize: '14px', 
        marginBottom: '16px', 
        color: '#888',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        Connected Accounts
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          background: '#333',
          borderRadius: '4px',
          color: '#666'
        }}>
          Multi-Account
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {accounts.map(({ id, label, color }) => {
          const accountStatus = status?.accounts[id];
          
          return (
            <div 
              key={id}
              style={{
                padding: '12px',
                background: '#111',
                borderRadius: '8px',
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: color,
                  fontSize: '14px'
                }}>
                  {label}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#666',
                  background: '#222',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  12 videos/day
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* YouTube Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: accountStatus?.youtube ? '#065f46' : '#333',
                    color: accountStatus?.youtube ? '#10b981' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {accountStatus?.youtube ? '✓' : '○'} YouTube
                  </span>
                  {!accountStatus?.youtube && (
                    <button
                      onClick={() => window.location.href = `/api/auth/youtube/authorise?account=${id}`}
                      style={{
                        padding: '4px 10px',
                        background: '#FF0000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* TikTok Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: accountStatus?.tiktok ? '#065f46' : '#333',
                    color: accountStatus?.tiktok ? '#10b981' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {accountStatus?.tiktok ? '✓' : '○'} TikTok
                  </span>
                  {!accountStatus?.tiktok && (
                    <button
                      onClick={() => window.location.href = `/api/auth/tiktok/authorise?account=${id}`}
                      style={{
                        padding: '4px 10px',
                        background: '#000',
                        color: '#69C9D0',
                        border: '1px solid #69C9D0',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Show connected account names */}
              {(accountStatus?.youtube || accountStatus?.tiktok) && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '11px', 
                  color: '#666',
                  display: 'flex',
                  gap: '12px'
                }}>
                  {accountStatus?.youtube && accountStatus.youtubeName && (
                    <span>📺 {accountStatus.youtubeName}</span>
                  )}
                  {accountStatus?.tiktok && accountStatus.tiktokName && (
                    <span>📱 @{accountStatus.tiktokName}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '16px', 
        padding: '10px', 
        background: '#0a0a0a',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#888',
        textAlign: 'center'
      }}>
        {status?.accounts.aurora.youtube && status?.accounts.aurora.tiktok &&
         status?.accounts.nova.youtube && status?.accounts.nova.tiktok ? (
          <span style={{ color: '#10b981' }}>
            ✓ All accounts connected — Ready for 24 videos/day
          </span>
        ) : (
          <span>
            Connect all accounts to enable 24 videos/day publishing
          </span>
        )}
      </div>
    </div>
  );
}
