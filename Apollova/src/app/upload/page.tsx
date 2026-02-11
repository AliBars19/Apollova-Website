"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '../components/AdminNavbar';

type AccountId = 'aurora' | 'mono';

export default function UploadPage() {
  const router = useRouter();
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

  const accountColors = {
    aurora: { bg: '#8B5CF6', text: '#fff' },
    mono: { bg: '#F59E0B', text: '#000' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <AdminNavbar />
      
      <main style={{ padding: '100px 20px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Upload Videos</h1>
        <p style={{ color: '#888', marginBottom: '32px' }}>
          Upload videos to publish to TikTok and YouTube
        </p>

        {/* Account Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: '#888',
            fontSize: '14px'
          }}>
            Select Account
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['aurora', 'mono'] as AccountId[]).map((acc) => (
              <button
                key={acc}
                onClick={() => setAccount(acc)}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: account === acc 
                    ? `2px solid ${accountColors[acc].bg}` 
                    : '2px solid #333',
                  background: account === acc 
                    ? accountColors[acc].bg + '15' 
                    : '#111',
                  color: account === acc ? accountColors[acc].bg : '#666',
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
                  {acc === 'aurora' ? '🌌' : '⭐'}
                </span>
                <span>Visuals {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
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
            border: `2px dashed ${dragActive ? accountColors[account].bg : '#333'}`,
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            background: dragActive ? accountColors[account].bg + '10' : '#111',
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
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>
            Drag & drop videos here
          </p>
          <p style={{ color: '#666', fontSize: '14px' }}>
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
              <h3 style={{ fontSize: '16px' }}>
                {files.length} video{files.length !== 1 ? 's' : ''} selected
              </h3>
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                background: accountColors[account].bg + '20',
                color: accountColors[account].bg,
                fontWeight: '500',
              }}>
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
                    background: '#1a1a1a',
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
                      }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#666' }}>
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
              background: uploading ? '#333' : accountColors[account].bg,
              color: uploading ? '#666' : accountColors[account].text,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {uploading ? (
              <>Uploading... {progress}%</>
            ) : (
              <>Upload {files.length} video{files.length !== 1 ? 's' : ''} to {account.charAt(0).toUpperCase() + account.slice(1)}</>
            )}
          </button>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div style={{
            marginTop: '16px',
            background: '#1a1a1a',
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
