"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Video } from "../types";
import VideoCard from "../components/VideoCard";
import LogoutButton from "../components/LogoutButton";
import ConnectionStatus from "../components/ConnectionStatus";
import TikTokPublishDrawer, { TikTokPublishData } from "../components/TikTokPublishDrawer";

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

  const handlePublishClick = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setSelectedVideo(video);
      setPublishDrawerOpen(true);
    }
  };

  const handleTikTokPublish = async (publishData: TikTokPublishData) => {
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

      // Check if video was cleaned up (deleted)
      if (data.cleaned) {
        console.log('✓ Video published and removed from server');
        setVideos((prev) => prev.filter((v) => v.id === publishData.videoId));
        alert(`✓ Published successfully to TikTok!\n\nVideo has been removed from server.`);
      } else {
        // Video still exists (partial failure or kept)
        setVideos((prev) =>
          prev.map((v) =>
            v.id === publishData.videoId 
              ? { 
                  ...v, 
                  status: data.video.status,
                  tiktok: data.video.tiktok,
                  youtube: data.video.youtube
                } 
              : v
          )
        );

        if (data.results?.tiktok?.success) {
          alert('✓ Published to TikTok successfully!');
        } else {
          alert('✗ Failed to publish to TikTok.\n\nCheck console for errors.');
        }
      }

    } catch (error) {
      console.error('Publish error:', error);
      alert('Error publishing video');
    }
  };

  if (authChecking) {
    return (
      <main className="dashboard">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="dashboard">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 className="title">Your Video Dashboard</h1>
          <LogoutButton />
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
              onPublish={handlePublishClick}
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
          onPublish={handleTikTokPublish}
        />,
        document.body
      )}
    </>
  );
}