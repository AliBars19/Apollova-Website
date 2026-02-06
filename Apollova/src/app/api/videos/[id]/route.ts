import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Video } from "@/app/types";

const ROOT = path.resolve("./");
const DATA_FILE = path.join(ROOT, "data", "videos.json");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!fs.existsSync(DATA_FILE)) {
    return NextResponse.json({ error: "No videos data" }, { status: 404 });
  }

  const videos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const index = videos.findIndex((v) => v.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const video = videos[index];

  console.log("DELETE requested for ID:", id);

  // Delete video file from filesystem
  if (video.url) {
    const filename = video.url.replace("/uploads/", "");
    const filePath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("Deleted file:", filename);
      } catch (err) {
        console.warn("Failed to delete video file:", err);
      }
    }
  }

  // Remove from JSON
  videos.splice(index, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!fs.existsSync(DATA_FILE)) {
    return NextResponse.json({ error: "No videos data" }, { status: 404 });
  }

  const updates = await req.json();
  const videos: Video[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  const video = videos.find((v) => v.id === id);
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  console.log("PATCH requested for ID:", id);
  console.log("Updates:", updates);

  // Ensure platform objects exist
  if (!video.tiktok) {
    video.tiktok = { caption: "", status: "pending" };
  }
  if (!video.youtube) {
    video.youtube = {
      title: "",
      description: "",
      tags: [],
      category: "10",
      privacy: "public",
      status: "pending"
    };
  }

  // Update caption (simple field for backward compatibility)
  if (typeof updates.caption === "string") {
    video.tiktok.caption = updates.caption;
    video.youtube.description = updates.caption;
  }

  // Update TikTok data if provided
  if (updates.tiktok) {
    video.tiktok = {
      ...video.tiktok,
      ...updates.tiktok,
    };
  }

  // Update YouTube data if provided
  if (updates.youtube) {
    video.youtube = {
      ...video.youtube,
      ...updates.youtube,
    };
  }

  // Update scheduling
  if (typeof updates.scheduledAt === "string" || updates.scheduledAt === null || updates.scheduledAt === undefined) {
    video.scheduledAt = updates.scheduledAt || undefined;
    // Update status based on scheduling
    if (updates.scheduledAt) {
      video.status = "scheduled";
    } else if (video.status === "scheduled") {
      video.status = "draft"; // Unscheduled
    }
  }

  // Update overall status if provided
  if (updates.status) {
    video.status = updates.status;
  }

  // Save changes
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  console.log("Video updated successfully");
  return NextResponse.json({ ok: true, video });
}