import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { Video } from "@/app/types";
import { withLockedJsonFile } from "@/utils/fileUtils";

const ROOT = path.resolve("./");
const DATA_FILE = path.join(ROOT, "data", "videos.json");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Capture deleted video info via a wrapper object (avoids TS closure narrowing issue)
  const result: { video: Video | null } = { video: null };

  await withLockedJsonFile<Video[]>(DATA_FILE, [], (videos) => {
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) return videos;
    result.video = videos[index];
    videos.splice(index, 1);
    return videos;
  });

  if (!result.video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  console.log("DELETE requested for ID:", id);

  // Delete video file from filesystem
  if (result.video.url) {
    const filename = result.video.url.replace("/uploads/", "");
    const filePath = path.join(UPLOAD_DIR, filename);
    try {
      await fs.unlink(filePath);
      console.log("Deleted file:", filename);
    } catch (err) {
      console.warn("Failed to delete video file:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const updates = await req.json();

  console.log("PATCH requested for ID:", id);
  console.log("Updates:", updates);

  let found = false;
  let updatedVideo: Video | null = null;

  await withLockedJsonFile<Video[]>(DATA_FILE, [], (videos) => {
    const video = videos.find((v) => v.id === id);
    if (!video) return videos;
    found = true;

    // Ensure platform objects exist
    if (!video.tiktok) {
      video.tiktok = { caption: "", status: "pending" } as Video["tiktok"];
    }
    if (!video.youtube) {
      video.youtube = {
        title: "",
        description: "",
        tags: [],
        category: "10",
        privacy: "public",
        status: "pending"
      } as Video["youtube"];
    }

    // Update caption
    if (typeof updates.caption === "string") {
      video.tiktok.caption = updates.caption;
      video.youtube.description = updates.caption;
    }

    // Update TikTok data
    if (updates.tiktok) {
      video.tiktok = { ...video.tiktok, ...updates.tiktok };
    }

    // Update YouTube data
    if (updates.youtube) {
      video.youtube = { ...video.youtube, ...updates.youtube };
    }

    // Update scheduling
    if (typeof updates.scheduledAt === "string" || updates.scheduledAt === null || updates.scheduledAt === undefined) {
      video.scheduledAt = updates.scheduledAt || undefined;
      if (updates.scheduledAt) {
        video.status = "scheduled";
      } else if (video.status === "scheduled") {
        video.status = "draft";
      }
    }

    // Update overall status
    if (updates.status) {
      video.status = updates.status;
    }

    // Update account
    if (updates.account && ['aurora', 'mono', 'onyx'].includes(updates.account)) {
      video.account = updates.account;
    }

    updatedVideo = video;
    return videos;
  });

  if (!found) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  console.log("Video updated successfully");
  return NextResponse.json({ ok: true, video: updatedVideo });
}
