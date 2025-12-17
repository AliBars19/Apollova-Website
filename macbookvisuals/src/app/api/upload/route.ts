import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const DATA_FILE = path.join(process.cwd(), "data", "videos.json");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Ensure folders exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

  // Save video file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = path.join(UPLOAD_DIR, file.name);
  fs.writeFileSync(filePath, buffer);

  // Create video record
  const videos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  const video = {
    id: crypto.randomUUID(),
    filename: file.name,
    url: `/uploads/${file.name}`,
    caption: "",
    status: "draft",
  };

  videos.push(video);
  fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2));

  return NextResponse.json({ ok: true, video });
}
