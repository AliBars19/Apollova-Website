// app/types.ts

export type VideoStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type PlatformStatus = "pending" | "published" | "failed";

export interface Video {
  id: string;           
  filename: string;     
  url: string;          
  uploadedAt: string;   
  scheduledAt?: string; 
  status: VideoStatus;

  tiktok: {
    caption: string;
    status: PlatformStatus;
    videoId?: string;
    publishedAt?: string;
    error?: string | null;
  };

  youtube: {
    title: string;
    description: string;
    tags: string[];
    category: string;
    privacy: "public" | "unlisted" | "private";
    status: PlatformStatus;
    videoId?: string;
    publishedAt?: string;
    error?: string | null;
  };
}