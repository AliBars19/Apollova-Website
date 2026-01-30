"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../components/AdminNavbar";

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function Upload() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'pending',
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    const formData = new FormData();
    formData.append("file", uploadFile.file);

    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
        )
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Upload failed");
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
        )
      );

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'error', error: errorMsg } : f
        )
      );
      return false;
    }
  };

  const uploadAll = async () => {
    if (files.length === 0) return;

    setUploading(true);

    // Upload all files in parallel
    const results = await Promise.all(
      files.filter(f => f.status === 'pending').map(uploadFile)
    );

    setUploading(false);

    const successCount = results.filter(Boolean).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }

    if (failCount > 0) {
      alert(`Uploaded ${successCount} files successfully. ${failCount} failed.`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <>
      <AdminNavbar />
      <main className="upload-page" style={{ paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="title">Upload Videos</h1>

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `3px dashed ${dragActive ? '#00f5ff' : '#333'}`,
              borderRadius: '16px',
              padding: '60px 40px',
              textAlign: 'center',
              background: dragActive ? 'rgba(0, 245, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: '32px'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {dragActive ? '📂' : '🎥'}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: '#fff' }}>
              {dragActive ? 'Drop videos here' : 'Click or drag videos to upload'}
            </h2>
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
              Upload multiple MP4 files at once
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

          {/* Stats */}
          {files.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px'
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#888' }}>{files.length}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffcf66' }}>{pendingCount}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8bff9c' }}>{successCount}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Success</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b81' }}>{errorCount}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Failed</div>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: '#ccc' }}>
                Files ({files.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: `1px solid ${
                        uploadFile.status === 'success' ? '#8bff9c' :
                        uploadFile.status === 'error' ? '#ff6b81' :
                        uploadFile.status === 'uploading' ? '#00f5ff' :
                        '#333'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    {/* Icon */}
                    <div style={{ fontSize: '32px' }}>
                      {uploadFile.status === 'success' ? '✅' :
                       uploadFile.status === 'error' ? '❌' :
                       uploadFile.status === 'uploading' ? '⏳' :
                       '🎬'}
                    </div>

                    {/* File Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {uploadFile.file.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        {formatFileSize(uploadFile.file.size)} • {uploadFile.status}
                      </div>
                      {uploadFile.error && (
                        <div style={{ fontSize: '11px', color: '#ff6b81', marginTop: '4px' }}>
                          {uploadFile.error}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {uploadFile.status === 'pending' && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(255, 107, 129, 0.1)',
                          border: '1px solid #ff6b81',
                          borderRadius: '8px',
                          color: '#ff6b81',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 107, 129, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 107, 129, 0.1)'}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn outline"
              style={{ flex: 1, padding: '16px' }}
            >
              Cancel
            </button>
            <button
              onClick={uploadAll}
              disabled={pendingCount === 0 || uploading}
              className="btn primary"
              style={{ 
                flex: 2, 
                padding: '16px',
                opacity: pendingCount === 0 || uploading ? 0.5 : 1,
                cursor: pendingCount === 0 || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? `Uploading ${files.filter(f => f.status === 'uploading').length}...` : `Upload ${pendingCount} ${pendingCount === 1 ? 'Video' : 'Videos'}`}
            </button>
          </div>

          {successCount > 0 && !uploading && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(139, 255, 156, 0.1)',
              border: '1px solid #8bff9c',
              borderRadius: '12px',
              color: '#8bff9c',
              textAlign: 'center'
            }}>
              ✓ {successCount} {successCount === 1 ? 'video' : 'videos'} uploaded successfully! Redirecting to dashboard...
            </div>
          )}
        </div>
      </main>
    </>
  );
}