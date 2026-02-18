"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Video, AccountId } from "../types";
import VideoCard from "../components/VideoCard";
import ConnectionStatus from "../components/ConnectionStatus";
import TikTokPublishDrawer, { TikTokPublishData } from "../components/TikTokPublishDrawer";
import BulkScheduleButton from "../components/BulkScheduleButton";
import AdminNavbar from "../components/AdminNavbar";
import { useTheme } from "@/context/ThemeContext";

interface AdvancedSettings {
  allowDeletePartialTikTok: boolean; // TikTok succeeded, YouTube failed
  allowDeletePartialYouTube: boolean; // YouTube succeeded, TikTok failed
  allowDeleteBothFailed: boolean; // Both failed
}

export default function Dashboard() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Visibility state
  const [visibility, setVisibility] = useState<{ aurora: boolean; mono: boolean; onyx: boolean }>({
    aurora: true,
    mono: true,
    onyx: true,
  });
  
  // Advanced settings
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    allowDeletePartialTikTok: false,
    allowDeletePartialYouTube: false,
    allowDeleteBothFailed: false,
  });
  
  // TikTok publish drawer state
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load advanced settings from localStorage
    const savedSettings = localStorage.getItem('apollova-advanced-settings');
    if (savedSettings) {
      try {
        setAdvancedSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
    checkAuth();
  }, []);

  const saveAdvancedSettings = (settings: AdvancedSettings) => {
    setAdvancedSettings(settings);
    localStorage.setItem('apollova-advanced-settings', JSON.stringify(settings));
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push('/login');
      } else {
        setAuthChecking(false);
        fetchVideos();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/videos");
      if (!res.ok) throw new Error("Failed to fetch videos");

      const data: Video[] = await res.json();
      setVideos(data);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = (account: AccountId, visible: boolean) => {
    setVisibility(prev => ({ ...prev, [account]: visible }));
  };

  const handleSave = async (updated: Video) => {
    const res = await fetch(`/api/videos/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: updated.tiktok.caption,
        scheduledAt: updated.scheduledAt,
        tiktok: updated.tiktok,
        youtube: updated.youtube,
        account: updated.account,
      }),
    });

    if (!res.ok) {
      console.error("Failed to save video");
      return;
    }

    setVideos((prev) =>
      prev.map((v) => (v.id === updated.id ? updated : v))
    );
  };

  const handleDelete = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    // Check if deletion is allowed based on status and settings
    const tiktokOk = video.tiktok.status === 'published';
    const youtubeOk = video.youtube.status === 'published';
    
    if (video.status === 'partial') {
      if (tiktokOk && !youtubeOk && !advancedSettings.allowDeletePartialTikTok) {
        alert('Cannot delete: TikTok succeeded but YouTube failed.\n\nEnable "Allow delete when TikTok succeeded" in Advanced Settings to allow this.');
        return;
      }
      if (!tiktokOk && youtubeOk && !advancedSettings.allowDeletePartialYouTube) {
        alert('Cannot delete: YouTube succeeded but TikTok failed.\n\nEnable "Allow delete when YouTube succeeded" in Advanced Settings to allow this.');
        return;
      }
    }
    
    if (video.status === 'failed' && !advancedSettings.allowDeleteBothFailed) {
      alert('Cannot delete: Both uploads failed.\n\nEnable "Allow delete when both failed" in Advanced Settings to allow this.');
      return;
    }

    if (!confirm('Are you sure you want to delete this video?')) return;

    const res = await fetch(`/api/videos/${videoId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete video");
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  // TikTok Publish - Opens drawer with compliance form
  const handleTikTokPublishClick = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setSelectedVideo(video);
      setPublishDrawerOpen(true);
    }
  };

  // YouTube Only Publish
  const handleYouTubePublish = async (videoId: string) => {
    try {
      const res = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'youtube',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to publish to YouTube');
      }

      const data = await res.json();

      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId 
            ? { 
                ...v, 
                status: data.video.status,
                youtube: data.video.youtube
              } 
            : v
        )
      );

      if (data.results?.youtube?.success) {
        alert('✓ Published to YouTube successfully!');
      } else {
        alert('✗ Failed to publish to YouTube.\n\n' + (data.results?.youtube?.error || 'Unknown error'));
      }

    } catch (error) {
      console.error('YouTube publish error:', error);
      alert('Error publishing to YouTube');
    }
  };

  // Publish Both - YouTube + TikTok Public (post-audit)
  const handlePublishBoth = async (videoId: string) => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      const res = await fetch(`/api/videos/${videoId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'both',
          publishData: {
            videoId: videoId,
            title: video.tiktok.caption,
            privacyLevel: 'PUBLIC_TO_EVERYONE',
            disableComment: false,
            disableDuet: false,
            disableStitch: false,
            commercialContent: {
              enabled: false,
              yourBrand: false,
              brandedContent: false,
            },
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to publish');
      }

      const data = await res.json();

      if (data.cleaned) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
        alert('✓ Published to both platforms!\n\n✓ YouTube: Live\n✓ TikTok: Published publicly\n\nVideo removed from server.');
      } else {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId 
              ? { 
                  ...v, 
                  status: data.video.status,
                  tiktok: data.video.tiktok,
                  youtube: data.video.youtube
                } 
              : v
          )
        );

        const tiktokStatus = data.results?.tiktok?.success ? '✓ TikTok: Published' : '✗ TikTok: Failed';
        const youtubeStatus = data.results?.youtube?.success ? '✓ YouTube: Published' : '✗ YouTube: Failed';
        
        alert(`Publishing complete!\n\n${youtubeStatus}\n${tiktokStatus}`);
      }

    } catch (error) {
      console.error('Publish error:', error);
      alert('Error publishing video');
    }
  };

  // TikTok Compliant Publish from Drawer
  const handleTikTokCompliantPublish = async (publishData: TikTokPublishData) => {
    try {
      const res = await fetch(`/api/videos/${publishData.videoId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'tiktok',
          publishData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to publish video');
      }

      const data = await res.json();

      setVideos((prev) =>
        prev.map((v) =>
          v.id === publishData.videoId 
            ? { 
                ...v, 
                status: data.video.status,
                tiktok: data.video.tiktok
              } 
            : v
        )
      );

      if (data.results?.tiktok?.success) {
        alert('✓ Published to TikTok successfully!');
      } else {
        alert('✗ Failed to publish to TikTok.\n\n' + (data.results?.tiktok?.error || 'Check console for errors'));
      }

    } catch (error) {
      console.error('TikTok publish error:', error);
      alert('Error publishing to TikTok');
    }
  };

  // Filter videos by visibility
  const filteredVideos = videos.filter(v => visibility[v.account || 'aurora']);

  if (authChecking) {
    return (
      <>
        <AdminNavbar />
        <main className="dashboard" style={{ 
          paddingTop: '80px',
          background: colors.background,
          minHeight: '100vh',
          color: colors.text
        }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Checking authentication...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <main className="dashboard" style={{ 
        paddingTop: '80px',
        background: colors.background,
        minHeight: '100vh',
        color: colors.text
      }}>
        {/* Header with Bulk Schedule Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Your Video Dashboard</h1>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <BulkScheduleButton onScheduleComplete={fetchVideos} />
          </div>
        </div>

        {/* Advanced Settings Dropdown */}
        <div style={{
          marginBottom: '20px',
          background: colors.backgroundSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Advanced Settings
            </span>
            <span style={{ 
              transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>
              ▼
            </span>
          </button>
          
          {advancedOpen && (
            <div style={{
              padding: '16px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '12px', 
                color: colors.textSecondary,
                marginBottom: '8px'
              }}>
                Control when partial or failed uploads can be deleted:
              </p>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: colors.text,
              }}>
                <input
                  type="checkbox"
                  checked={advancedSettings.allowDeletePartialTikTok}
                  onChange={(e) => saveAdvancedSettings({
                    ...advancedSettings,
                    allowDeletePartialTikTok: e.target.checked
                  })}
                  style={{ width: '16px', height: '16px', accentColor: colors.accent }}
                />
                Allow delete when TikTok succeeded but YouTube failed
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: colors.text,
              }}>
                <input
                  type="checkbox"
                  checked={advancedSettings.allowDeletePartialYouTube}
                  onChange={(e) => saveAdvancedSettings({
                    ...advancedSettings,
                    allowDeletePartialYouTube: e.target.checked
                  })}
                  style={{ width: '16px', height: '16px', accentColor: colors.accent }}
                />
                Allow delete when YouTube succeeded but TikTok failed
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: colors.text,
              }}>
                <input
                  type="checkbox"
                  checked={advancedSettings.allowDeleteBothFailed}
                  onChange={(e) => saveAdvancedSettings({
                    ...advancedSettings,
                    allowDeleteBothFailed: e.target.checked
                  })}
                  style={{ width: '16px', height: '16px', accentColor: colors.accent }}
                />
                Allow delete when both uploads failed
              </label>
            </div>
          )}
        </div>

        <ConnectionStatus 
          visibility={visibility}
          onVisibilityChange={handleVisibilityChange}
        />

        {loading && <p style={{ color: colors.textSecondary }}>Loading videos...</p>}
        {error && <p style={{ color: '#ff6b81' }}>Error: {error}</p>}

        {!loading && filteredVideos.length === 0 && (
          <p style={{ color: colors.textSecondary }}>
            {videos.length === 0 
              ? 'No videos yet. Upload or send some from your pipeline.'
              : 'No videos visible. Adjust visibility filters above.'}
          </p>
        )}

        <div className="grid">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onSave={handleSave}
              onPublish={handleTikTokPublishClick}
              onPublishYouTube={handleYouTubePublish}
              onPublishBoth={handlePublishBoth}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </main>

      {/* TikTok Publish Drawer - Rendered at document.body level using Portal */}
      {mounted && createPortal(
        <TikTokPublishDrawer
          video={selectedVideo}
          isOpen={publishDrawerOpen}
          onClose={() => {
            setPublishDrawerOpen(false);
            setSelectedVideo(null);
          }}
          onPublish={handleTikTokCompliantPublish}
        />,
        document.body
      )}
    </>
  );
}
