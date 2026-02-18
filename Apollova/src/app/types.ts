// app/types.ts

export type VideoStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "partial";
export type PlatformStatus = "pending" | "published" | "failed" | "processing";
export type AccountId = "aurora" | "mono" | "onyx";

export interface Video {
  id: string;           
  filename: string;     
  url: string;          
  uploadedAt: string;   
  scheduledAt?: string; 
  status: VideoStatus;
  
  // Which account to publish to
  account: AccountId;

  tiktok: {
    caption: string;
    status: PlatformStatus;
    publishId?: string;
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
