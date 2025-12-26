"use client";

import { useEffect, useState } from 'react';

export default function ConnectionStatus() {
  const [platforms, setPlatforms] = useState({
    youtube: false,
    tiktok: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setPlatforms(data.platforms || { youtube: false, tiktok: false });
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      padding: '12px',
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#888' }}>
          Connected Platforms
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            background: platforms.youtube ? '#065f46' : '#333',
            color: platforms.youtube ? '#10b981' : '#666'
          }}>
            {platforms.youtube ? '✓' : '○'} YouTube
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            background: platforms.tiktok ? '#065f46' : '#333',
            color: platforms.tiktok ? '#10b981' : '#666'
          }}>
            {platforms.tiktok ? '✓' : '○'} TikTok
          </span>
        </div>
      </div>

      {!platforms.youtube && (
        <button
          onClick={() => window.location.href = '/api/auth/youtube/authorise'}
          style={{
            padding: '8px 16px',
            background: '#FF0000',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Connect YouTube
        </button>
      )}

      {!platforms.tiktok && (
        <button
          onClick={() => window.location.href = '/api/auth/tiktok/authorise'}
          style={{
            padding: '8px 16px',
            background: '#000000',
            color: '#69C9D0',
            border: '1px solid #69C9D0',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Connect TikTok
        </button>
      )}
    </div>
  );
}