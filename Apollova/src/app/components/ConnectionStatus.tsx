"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

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
    mono: AccountStatus;
    onyx: AccountStatus;
  };
}

type AccountId = 'aurora' | 'mono' | 'onyx';

interface ConnectionStatusProps {
  visibility: { aurora: boolean; mono: boolean; onyx: boolean };
  onVisibilityChange: (account: AccountId, visible: boolean) => void;
}

export default function ConnectionStatus({ visibility, onVisibilityChange }: ConnectionStatusProps) {
  const { theme, colors } = useTheme();
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

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

  const handleDisconnect = async (account: AccountId, platform: 'youtube' | 'tiktok') => {
    if (!confirm(`Disconnect ${platform} from ${account} account?`)) return;
    
    setDisconnecting(`${account}-${platform}`);
    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, platform }),
      });
      
      if (response.ok) {
        // Refresh status
        await checkStatus();
      } else {
        alert('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) return null;

  const accounts: { id: AccountId; label: string; color: string; emoji: string }[] = [
    { id: 'aurora', label: 'Aurora', color: '#8B5CF6', emoji: '🌌' },
    { id: 'mono', label: 'Mono', color: '#F59E0B', emoji: '⭐' },
    { id: 'onyx', label: 'Onyx', color: '#1E90FF', emoji: '💎' },
  ];

  const totalConnected = accounts.reduce((sum, acc) => {
    const s = status?.accounts[acc.id];
    return sum + (s?.youtube && s?.tiktok ? 1 : 0);
  }, 0);

  return (
    <div style={{
      padding: '16px',
      background: colors.backgroundSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      {/* Header with visibility toggles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h3 style={{ 
          fontSize: '14px', 
          margin: 0,
          color: colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Connected Accounts
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            background: colors.backgroundTertiary,
            borderRadius: '4px',
            color: colors.textSecondary
          }}>
            {totalConnected}/3 Ready
          </span>
        </h3>

        {/* Visibility Toggles */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: colors.textSecondary }}>Show:</span>
          {accounts.map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => onVisibilityChange(id, !visibility[id])}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${visibility[id] ? color : colors.border}`,
                background: visibility[id] ? `${color}20` : 'transparent',
                color: visibility[id] ? color : colors.textSecondary,
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Account Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {accounts.map(({ id, label, color, emoji }) => {
          const accountStatus = status?.accounts[id];
          
          return (
            <div 
              key={id}
              style={{
                padding: '12px',
                background: colors.backgroundTertiary,
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
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{emoji}</span>
                  {label}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: colors.textSecondary,
                  background: colors.backgroundSecondary,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: accountStatus?.youtube ? '#065f46' : colors.backgroundSecondary,
                    color: accountStatus?.youtube ? '#10b981' : colors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {accountStatus?.youtube ? '✓' : '○'} YouTube
                  </span>
                  {accountStatus?.youtube ? (
                    <button
                      onClick={() => handleDisconnect(id, 'youtube')}
                      disabled={disconnecting === `${id}-youtube`}
                      style={{
                        padding: '4px 6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        opacity: disconnecting === `${id}-youtube` ? 0.5 : 1,
                      }}
                      title="Disconnect YouTube"
                    >
                      ✕
                    </button>
                  ) : (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: accountStatus?.tiktok ? '#065f46' : colors.backgroundSecondary,
                    color: accountStatus?.tiktok ? '#10b981' : colors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {accountStatus?.tiktok ? '✓' : '○'} TikTok
                  </span>
                  {accountStatus?.tiktok ? (
                    <button
                      onClick={() => handleDisconnect(id, 'tiktok')}
                      disabled={disconnecting === `${id}-tiktok`}
                      style={{
                        padding: '4px 6px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        opacity: disconnecting === `${id}-tiktok` ? 0.5 : 1,
                      }}
                      title="Disconnect TikTok"
                    >
                      ✕
                    </button>
                  ) : (
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
                  color: colors.textSecondary,
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
        background: colors.background,
        borderRadius: '6px',
        fontSize: '12px',
        color: colors.textSecondary,
        textAlign: 'center'
      }}>
        {totalConnected === 3 ? (
          <span style={{ color: '#10b981' }}>
            ✓ All accounts connected — Ready for 36 videos/day
          </span>
        ) : (
          <span>
            Connect all accounts to enable 36 videos/day publishing
          </span>
        )}
      </div>
    </div>
  );
}
