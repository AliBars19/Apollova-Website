import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOT = path.resolve("./");
const DATA_FILE = path.join(ROOT, "data", "videos.json");



export async function GET() {
  if (!fs.existsSync(DATA_FILE)) {
    return NextResponse.json([]);
  }

  const videos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  return NextResponse.json(videos);
}
