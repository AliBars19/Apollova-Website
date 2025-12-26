"use client";

import { useState } from "react";
import type { Video } from "../types";

interface VideoCardProps {
  video: Video;
  onSave: (video: Video) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function VideoCard({ video, onSave, onPublish, onDelete }: VideoCardProps) {
  const [caption, setCaption] = useState(video.tiktok.caption);
  const [scheduledAt, setScheduledAt] = useState(video.scheduledAt || "");
  const [videoError, setVideoError] = useState(false);

  const handleSave = () => {
    const updated: Video = {
      ...video,
      scheduledAt: scheduledAt || undefined,
      tiktok: {
        ...video.tiktok,
        caption: caption,
      },
      youtube: {
        ...video.youtube,
        description: caption,
      },
    };
    onSave(updated);
  };

  const isPublished = video.status === "published";
  const isPartialSuccess = 
    (video.tiktok.status === "published" && video.youtube.status === "failed") ||
    (video.youtube.status === "published" && video.tiktok.status === "failed");

  return (
    <div className="card video-card">
      {/* Video Preview */}
      <div className="video-thumb">
        {!videoError ? (
          <video 
            controls 
            style={{ width: '100%', maxHeight: '240px' }}
            onError={() => setVideoError(true)}
          >
            <source src={encodeURI(video.url)} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div style={{
            width: '100%',
            height: '200px',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎥</div>
              <div style={{ fontSize: '14px' }}>Video preview unavailable</div>
              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
                {video.filename}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filename & Status */}
      <div className="video-meta">
        <p className="video-filename">{video.filename}</p>
        <span className={`status status-${video.status}`}>
          {video.status}
        </span>
      </div>

      {/* Platform Status */}
      {(video.tiktok.status || video.youtube.status) && (
        <div style={{ marginTop: '12px', fontSize: '13px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'center' }}>
            <span style={{ 
              color: video.tiktok.status === 'published' ? '#8bff9c' : 
                     video.tiktok.status === 'failed' ? '#ff6b81' : '#888'
            }}>
              {video.tiktok.status === 'published' ? '✓' : 
               video.tiktok.status === 'failed' ? '✗' : '○'} TikTok
            </span>
            {video.tiktok.videoId && (
              <span style={{ fontSize: '11px', color: '#666' }}>
                ({video.tiktok.videoId.substring(0, 8)}...)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              color: video.youtube.status === 'published' ? '#8bff9c' : 
                     video.youtube.status === 'failed' ? '#ff6b81' : '#888'
            }}>
              {video.youtube.status === 'published' ? '✓' : 
               video.youtube.status === 'failed' ? '✗' : '○'} YouTube
            </span>
            {video.youtube.videoId && (
              <span style={{ fontSize: '11px', color: '#666' }}>
                ({video.youtube.videoId})
              </span>
            )}
          </div>
          
          {/* Error messages */}
          {video.tiktok.error && (
            <div style={{ 
              marginTop: '8px', 
              padding: '6px 8px', 
              background: 'rgba(255, 107, 129, 0.1)', 
              borderRadius: '4px',
              fontSize: '11px',
              color: '#ff6b81'
            }}>
              TikTok: {video.tiktok.error}
            </div>
          )}
          {video.youtube.error && (
            <div style={{ 
              marginTop: '8px', 
              padding: '6px 8px', 
              background: 'rgba(255, 107, 129, 0.1)', 
              borderRadius: '4px',
              fontSize: '11px',
              color: '#ff6b81'
            }}>
              YouTube: {video.youtube.error}
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      <div className="field">
        <span>Caption</span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isPublished}
          rows={3}
        />
      </div>

      {/* Schedule */}
      <div className="field">
        <span>Schedule (optional)</span>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          disabled={isPublished}
        />
      </div>

      {/* Buttons */}
      <div className="video-actions">
        {!isPublished && (
          <>
            <button onClick={handleSave} className="btn primary">
              Save
            </button>
            <button onClick={() => onPublish(video.id)} className="btn primary">
              Publish now
            </button>
          </>
        )}
        
        {/* Delete button for failures */}
        {(video.status === 'failed' || isPartialSuccess) && (
          <button 
            onClick={() => {
              if (confirm(`Delete "${video.filename}"?\n\n${
                isPartialSuccess 
                  ? 'Note: This video was published to one platform but failed on the other.' 
                  : 'This video failed to publish.'
              }`)) {
                onDelete(video.id);
              }
            }}
            className="btn outline"
          >
            Delete
          </button>
        )}

        {/* Retry button */}
        {isPartialSuccess && (
          <button 
            onClick={() => onPublish(video.id)} 
            className="btn primary"
            title="Retry publishing to failed platform"
          >
            Retry Failed
          </button>
        )}
      </div>
    </div>
  );
}