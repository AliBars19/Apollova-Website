"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Video } from "../types";
import VideoCard from "../components/VideoCard";
import LogoutButton from "../components/LogoutButton";
import ConnectionStatus from "../components/ConnectionStatus";
import TikTokPublishDrawer, { TikTokPublishData } from "../components/TikTokPublishDrawer";
import BulkScheduleButton from "../components/BulkScheduleButton";
import AdminNavbar from "../components/AdminNavbar";

export default function Dashboard() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // TikTok publish drawer state
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

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

  const handleSave = async (updated: Video) => {
    const res = await fetch(`/api/videos/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: updated.tiktok.caption,
        scheduledAt: updated.scheduledAt,
        tiktok: updated.tiktok,
        youtube: updated.youtube,
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
            privacyLevel: 'PUBLIC_TO_EVERYONE', // Post-audit: publish publicly
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
        // Both succeeded - video deleted
        setVideos((prev) => prev.filter((v) => v.id === videoId));
        alert('✓ Published to both platforms!\n\n✓ YouTube: Live\n✓ TikTok: Published publicly\n\nVideo removed from server.');
      } else {
        // Update status
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

  if (authChecking) {
    return (
      <>
        <AdminNavbar />
        <main className="dashboard" style={{ paddingTop: '80px' }}>
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
      <main className="dashboard" style={{ paddingTop: '80px' }}>
        {/* Header with Bulk Schedule Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <h1 className="title" style={{ margin: 0 }}>Your Video Dashboard</h1>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <BulkScheduleButton onScheduleComplete={fetchVideos} />
          </div>
        </div>

        <ConnectionStatus/>

        {loading && <p>Loading videos...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && videos.length === 0 && (
          <p>No videos yet. Upload or send some from your pipeline.</p>
        )}

        <div className="grid">
          {videos.map((video) => (
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