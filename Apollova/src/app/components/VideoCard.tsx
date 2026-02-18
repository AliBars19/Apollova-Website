"use client";

import { useState } from "react";
import type { Video, AccountId } from "../types";
import { useTheme } from "@/context/ThemeContext";

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
  const { colors } = useTheme();
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

  const getStatusColor = () => {
    switch (video.status) {
      case "draft": return { bg: colors.backgroundTertiary, color: colors.textSecondary };
      case "scheduled": return { bg: '#3f2d10', color: '#ffcf66' };
      case "published": return { bg: '#12351a', color: '#8bff9c' };
      case "partial": return { bg: '#4a3000', color: '#ffa500' };
      case "failed": return { bg: '#3a1010', color: '#ff6b81' };
      default: return { bg: colors.backgroundTertiary, color: colors.textSecondary };
    }
  };

  const accountColors: Record<AccountId, { bg: string; text: string; emoji: string }> = {
    aurora: { bg: '#8B5CF6', text: '#fff', emoji: '🌌' },
    mono: { bg: '#F59E0B', text: '#000', emoji: '⭐' },
    onyx: { bg: '#1E90FF', text: '#fff', emoji: '💎' },
  };

  const statusStyle = getStatusColor();

  return (
    <div style={{
      background: colors.backgroundSecondary,
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Video Thumbnail */}
      <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '12px',
      }}>
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: colors.textSecondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
        }}>
          {video.filename}
        </p>
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
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span>{accountColors[video.account || 'aurora'].emoji}</span>
            {video.account || 'aurora'}
          </span>
          <span style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: statusStyle.bg,
            color: statusStyle.color,
          }}>
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
          background: video.tiktok.status === 'published' ? '#065f46' : colors.backgroundTertiary,
          color: video.tiktok.status === 'published' ? '#10b981' : colors.textSecondary,
        }}>
          TikTok: {video.tiktok.status}
        </span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: video.youtube.status === 'published' ? '#065f46' : colors.backgroundTertiary,
          color: video.youtube.status === 'published' ? '#10b981' : colors.textSecondary,
        }}>
          YouTube: {video.youtube.status}
        </span>
      </div>

      {/* Edit Form */}
      {editing ? (
        <div style={{ marginTop: "12px" }}>
          {/* Account Selector */}
          <div style={{ marginBottom: '10px' }}>
            <span style={{ 
              display: 'block', 
              marginBottom: '6px', 
              color: colors.textSecondary,
              fontSize: '14px' 
            }}>
              Publish Account
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['aurora', 'mono', 'onyx'] as AccountId[]).map((acc) => (
                <button
                  key={acc}
                  onClick={() => setAccount(acc)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: account === acc ? `2px solid ${accountColors[acc].bg}` : `2px solid ${colors.border}`,
                    background: account === acc ? `${accountColors[acc].bg}20` : 'transparent',
                    color: account === acc ? accountColors[acc].bg : colors.textSecondary,
                    cursor: 'pointer',
                    fontWeight: account === acc ? '600' : '400',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{accountColors[acc].emoji}</span>
                  {acc}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <span style={{ 
              display: 'block', 
              marginBottom: '6px', 
              color: colors.textSecondary,
              fontSize: '14px' 
            }}>
              Caption
            </span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <span style={{ 
              display: 'block', 
              marginBottom: '6px', 
              color: colors.textSecondary,
              fontSize: '14px' 
            }}>
              Schedule
            </span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: colors.background,
                color: colors.text,
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button 
              onClick={() => setEditing(false)}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '999px',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.text,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '999px',
                border: 'none',
                background: colors.accent,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ 
            fontSize: "13px", 
            color: colors.textSecondary, 
            marginTop: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {video.tiktok.caption || "No caption"}
          </p>

          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginTop: '12px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => setEditing(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.text,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Edit
            </button>

            {video.status !== 'published' && (
              <>
                <button 
                  onClick={() => onPublish(video.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: '1px solid #69C9D0',
                    background: 'transparent',
                    color: '#69C9D0',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  TikTok
                </button>

                {onPublishYouTube && (
                  <button 
                    onClick={() => onPublishYouTube(video.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '999px',
                      border: '1px solid #FF0000',
                      background: 'transparent',
                      color: '#FF0000',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    YouTube
                  </button>
                )}

                {onPublishBoth && (
                  <button 
                    onClick={() => onPublishBoth(video.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '999px',
                      border: 'none',
                      background: colors.accent,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Both
                  </button>
                )}
              </>
            )}

            <button 
              onClick={() => onDelete(video.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: '1px solid #ff6b81',
                background: 'transparent',
                color: '#ff6b81',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
