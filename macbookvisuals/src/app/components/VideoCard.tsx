"use client";

import { useState } from "react";
import type { Video } from "../types";

type VideoCardProps = {
  video: Video;
  onSave?: (updated: Video) => void;
  onPublish?: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
};

export default function VideoCard({
  video,
  onSave,
  onPublish,
  onDelete,
}: VideoCardProps) {
  // Use tiktok.caption instead of the old caption field
  const [caption, setCaption] = useState(video.tiktok.caption);
  const [scheduledAt, setScheduledAt] = useState(video.scheduledAt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isPublished = video.status === "published";

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);

    // Update the video object with the new structure
    const updated: Video = {
      ...video,
      scheduledAt: scheduledAt || undefined,
      // Update the tiktok caption
      tiktok: {
        ...video.tiktok,
        caption: caption,
      },
      // You can also update YouTube description to match if you want
      youtube: {
        ...video.youtube,
        description: caption, // Keep YouTube description in sync
      },
    };

    try {
      await onSave(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishClick = async () => {
    if (!onPublish) return;
    await onPublish(video.id);
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;
    const ok = confirm("Delete this video? This cannot be undone.");
    if (!ok) return;
    await onDelete(video.id);
  };

  const statusLabel =
    video.status.charAt(0).toUpperCase() + video.status.slice(1);

  return (
    <div className="card video-card">
      <div className="video-thumb">
        <video src={video.url} controls width={260} />
      </div>

      <div className="video-meta">
        <p className="video-filename">{video.filename}</p>
        <span className={`status ${video.status}`}>{statusLabel}</span>
      </div>

      <label className="field">
        <span>Caption</span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          disabled={isPublished}
        />
      </label>

      <label className="field">
        <span>Schedule (optional)</span>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          disabled={isPublished}
        />
      </label>

      <div className="video-actions">
        <button
          onClick={handleSave}
          disabled={saving || isPublished}
          className="btn primary"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
        </button>

        <button
          onClick={handlePublishClick}
          disabled={isPublished}
          className="btn outline"
        >
          Publish now
        </button>

        <button
          onClick={handleDeleteClick}
          disabled={isPublished}
          className="btn danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
}