"use client";

import { useState } from "react";
import type { Video, AccountId } from "../types";

interface VideoCardProps {
  video: Video;
  onSave: (video: Video) => void;
  onPublish: (videoId: string) => void;
  onPublishYouTube?: (videoId: string) => void;
  onPublishBoth?: (videoId: string) => void;
  onDelete: (videoId: string) => void;
}

export default function VideoCard({ 
  video, 
  onSave, 
  onPublish, 
  onPublishYouTube,
  onPublishBoth,
  onDelete 
}: VideoCardProps) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(video.tiktok.caption);
  const [scheduledAt, setScheduledAt] = useState(video.scheduledAt || "");
  const [account, setAccount] = useState<AccountId>(video.account || 'aurora');

  const handleSave = () => {
    onSave({
      ...video,
      tiktok: { ...video.tiktok, caption },
      scheduledAt: scheduledAt || undefined,
      account,
    });
    setEditing(false);
  };

  const getStatusClass = () => {
    switch (video.status) {
      case "draft": return "status-draft";
      case "scheduled": return "status-scheduled";
      case "published": return "status-published";
      default: return "status-draft";
    }
  };

  const accountColors = {
    aurora: { bg: '#8B5CF6', text: '#fff' },
    mono: { bg: '#F59E0B', text: '#000' },
  };

  return (
    <div className="card video-card">
      {/* Video Thumbnail */}
      <div className="video-thumb">
        <video
          src={video.url}
          style={{ maxHeight: "200px", width: "100%", objectFit: "contain" }}
          controls={false}
          muted
          onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
          onMouseOut={(e) => {
            const vid = e.target as HTMLVideoElement;
            vid.pause();
            vid.currentTime = 0;
          }}
        />
      </div>

      {/* Meta Info */}
      <div className="video-meta">
        <p className="video-filename">{video.filename}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Account Badge */}
          <span style={{
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            background: accountColors[video.account || 'aurora'].bg,
            color: accountColors[video.account || 'aurora'].text,
            textTransform: 'uppercase',
          }}>
            {video.account || 'aurora'}
          </span>
          <span className={`status ${getStatusClass()}`}>
            {video.status}
          </span>
        </div>
      </div>

      {/* Platform Statuses */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '8px',
        fontSize: '11px'
      }}>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: video.tiktok.status === 'published' ? '#065f46' : '#333',
          color: video.tiktok.status === 'published' ? '#10b981' : '#888',
        }}>
          TikTok: {video.tiktok.status}
        </span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: video.youtube.status === 'published' ? '#065f46' : '#333',
          color: video.youtube.status === 'published' ? '#10b981' : '#888',
        }}>
          YouTube: {video.youtube.status}
        </span>
      </div>

      {/* Edit Form */}
      {editing ? (
        <div style={{ marginTop: "12px" }}>
          {/* Account Selector */}
          <div className="field">
            <span>Publish Account</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['aurora', 'mono'] as AccountId[]).map((acc) => (
                <button
                  key={acc}
                  onClick={() => setAccount(acc)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: account === acc ? `2px solid ${accountColors[acc].bg}` : '2px solid #333',
                    background: account === acc ? accountColors[acc].bg + '20' : '#111',
                    color: account === acc ? accountColors[acc].bg : '#888',
                    cursor: 'pointer',
                    fontWeight: account === acc ? '600' : '400',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {acc}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Caption</span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div className="field">
            <span>Schedule</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="video-actions">
            <button className="btn outline" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ 
            fontSize: "13px", 
            color: "#aaa", 
            marginTop: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {video.tiktok.caption || "No caption"}
          </p>

          <div className="video-actions" style={{ flexWrap: 'wrap' }}>
            <button className="btn outline" onClick={() => setEditing(true)}>
              Edit
            </button>

            {video.status !== 'published' && (
              <>
                <button 
                  className="btn outline" 
                  onClick={() => onPublish(video.id)}
                  style={{ borderColor: '#69C9D0', color: '#69C9D0' }}
                >
                  TikTok
                </button>

                {onPublishYouTube && (
                  <button 
                    className="btn outline" 
                    onClick={() => onPublishYouTube(video.id)}
                    style={{ borderColor: '#FF0000', color: '#FF0000' }}
                  >
                    YouTube
                  </button>
                )}

                {onPublishBoth && (
                  <button 
                    className="btn primary" 
                    onClick={() => onPublishBoth(video.id)}
                  >
                    Both
                  </button>
                )}
              </>
            )}

            <button 
              className="btn outline" 
              onClick={() => onDelete(video.id)}
              style={{ borderColor: '#ff6b81', color: '#ff6b81' }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
