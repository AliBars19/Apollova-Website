import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parseFilename, generateCaption } from "@/utils/fileParser";

const ROOT = path.resolve("./");
const DATA_FILE = path.join(ROOT, "data", "videos.json");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Ensure folders exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

  // Parse filename to extract song title and artist
  const { title, artist } = parseFilename(file.name);
  console.log(`Parsed - Title: "${title}" | Artist: "${artist}"`);

  // Generate caption automatically
  const caption = generateCaption(title, artist);
  console.log(`Generated caption: ${caption}`);

  // Save video file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = path.join(UPLOAD_DIR, file.name);
  fs.writeFileSync(filePath, buffer);
  console.log(`Video saved: ${file.name}`);

  // Create video record with platform-specific data
  const videos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  const video = {
    id: crypto.randomUUID(),
    filename: file.name,
    url: `/uploads/${file.name}`,
    uploadedAt: new Date().toISOString(),
    status: "draft",
    tiktok: {
      caption: caption,
      status: "pending"
    },
    youtube: {
      title: `${title} - ${artist}`,
      description: caption,
      tags: ["fyp", "musica", "macbook", title, artist],
      category: "10", // Music category
      privacy: "public",
      status: "pending"
    }
  };

  videos.push(video);
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  console.log(`Video metadata saved with ID: ${video.id}`);
  return NextResponse.json({ ok: true, video });
}