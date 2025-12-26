"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Video } from "../types";
import VideoCard from "../components/VideoCard";
import LogoutButton from "../components/LogoutButton";
import ConnectionStatus from "../components/ConnectionStatus";

export default function Dashboard() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Check authentication on page load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      
      if (!data.authenticated) {
        // Not logged in, redirect to login
        router.push('/login');
      } else {
        // Authenticated, load videos
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

  const handlePublish = async (videoId: string) => {
    const res = await fetch(`/api/videos/${videoId}/publish`, {
      method: "POST",
    });

    if (!res.ok) {
      console.error("Failed to publish video");
      return;
    }

    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId 
          ? { 
              ...v, 
              status: "published",
              tiktok: { ...v.tiktok, status: "published" },
              youtube: { ...v.youtube, status: "published" }
            } 
          : v
      )
    );
  };

  // Show loading while checking auth
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
            onPublish={handlePublish}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </main>
  );
}