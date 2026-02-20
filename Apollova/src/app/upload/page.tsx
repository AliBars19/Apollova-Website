"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../components/AdminNavbar';
import { useTheme } from '@/context/ThemeContext';

type AccountId = 'aurora' | 'mono' | 'onyx';

export default function UploadPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [account, setAccount] = useState<AccountId>('aurora');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('video/')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type.startsWith('video/')
      );
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('video', file);
        formData.append('account', account);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const accountColors: Record<AccountId, { bg: string; text: string; emoji: string }> = {
    aurora: { bg: '#8B5CF6', text: '#fff', emoji: '🌌' },
    mono: { bg: '#F59E0B', text: '#000', emoji: '⭐' },
    onyx: { bg: '#1E90FF', text: '#fff', emoji: '💎' },
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.background }}>
      <AdminNavbar />
      
      <main style={{ padding: '100px 20px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px', color: colors.text }}>Upload Videos</h1>
        <p style={{ color: colors.textSecondary, marginBottom: '32px' }}>
          Upload videos to publish to TikTok and YouTube
        </p>

        {/* Account Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: colors.textSecondary,
            fontSize: '14px'
          }}>
            Select Account
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['aurora', 'mono', 'onyx'] as AccountId[]).map((acc) => (
              <button
                key={acc}
                onClick={() => setAccount(acc)}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: account === acc 
                    ? `2px solid ${accountColors[acc].bg}` 
                    : `2px solid ${colors.border}`,
                  background: account === acc 
                    ? accountColors[acc].bg + '15' 
                    : colors.backgroundSecondary,
                  color: account === acc ? accountColors[acc].bg : colors.textSecondary,
                  cursor: 'pointer',
                  fontWeight: account === acc ? '600' : '400',
                  fontSize: '16px',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '24px' }}>
                  {accountColors[acc].emoji}
                </span>
                <span>Apollova {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                  12 videos/day
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? accountColors[account].bg : colors.border}`,
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            background: dragActive ? accountColors[account].bg + '10' : colors.backgroundSecondary,
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
          <p style={{ fontSize: '18px', marginBottom: '8px', color: colors.text }}>
            Drag & drop videos here
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            or click to browse • MP4, MOV, WebM
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ fontSize: '16px', color: colors.text }}>
                {files.length} video{files.length !== 1 ? 's' : ''} selected
              </h3>
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                background: accountColors[account].bg + '20',
                color: accountColors[account].bg,
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span>{accountColors[account].emoji}</span>
                → {account.charAt(0).toUpperCase() + account.slice(1)} Account
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: colors.backgroundSecondary,
                    borderRadius: '8px',
                    borderLeft: `3px solid ${accountColors[account].bg}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🎬</span>
                    <div>
                      <p style={{ 
                        fontSize: '14px', 
                        marginBottom: '2px',
                        maxWidth: '400px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: colors.text,
                      }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b81',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '24px',
              background: uploading ? colors.backgroundTertiary : accountColors[account].bg,
              color: uploading ? colors.textSecondary : accountColors[account].text,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {uploading ? (
              <>Uploading... {progress}%</>
            ) : (
              <>
                <span>{accountColors[account].emoji}</span>
                Upload {files.length} video{files.length !== 1 ? 's' : ''} to {account.charAt(0).toUpperCase() + account.slice(1)}
              </>
            )}
          </button>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div style={{
            marginTop: '16px',
            background: colors.backgroundSecondary,
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '8px',
              background: accountColors[account].bg,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}
      </main>
    </div>
  );
}
