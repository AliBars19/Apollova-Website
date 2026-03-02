import { NextResponse } from "next/server";
import path from "path";
import { readJsonFile } from "@/utils/fileUtils";

const DATA_FILE = path.join(process.cwd(), "data", "videos.json");

export async function GET() {
  const videos = await readJsonFile(DATA_FILE, []);
  return NextResponse.json(videos);
}
