/**
 * Test Data Factories — e2e/fixtures/test-data.ts
 *
 * Centralised factories for all test data used across the suite.
 * Every factory returns a fresh object so tests never share mutable state.
 */

import type { Video } from '../../src/app/types';

export type AccountId = 'aurora' | 'mono' | 'onyx';

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export function buildVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: `test-video-${Date.now()}`,
    filename: 'aurora_test_song_artist.mp4',
    url: '/api/videos/stream/aurora_test_song_artist.mp4',
    uploadedAt: new Date().toISOString(),
    scheduledAt: undefined,
    status: 'draft',
    account: 'aurora',
    tiktok: {
      caption: 'Test caption for TikTok',
      status: 'pending',
      publishId: undefined,
      videoId: undefined,
      publishedAt: undefined,
      error: null,
    },
    youtube: {
      title: 'Test Video Title',
      description: 'Test description',
      tags: ['test', 'music'],
      category: 'Music',
      privacy: 'private',
      status: 'pending',
      videoId: undefined,
      publishedAt: undefined,
      error: null,
    },
    ...overrides,
  };
}

export function buildPublishedVideo(overrides: Partial<Video> = {}): Video {
  return buildVideo({
    status: 'published',
    tiktok: {
      caption: 'Published caption',
      status: 'published',
      publishId: 'tt-pub-123',
      videoId: 'tt-vid-123',
      publishedAt: new Date().toISOString(),
      error: null,
    },
    youtube: {
      title: 'Published YouTube Title',
      description: 'Published description',
      tags: ['published'],
      category: 'Music',
      privacy: 'public',
      status: 'published',
      videoId: 'yt-vid-123',
      publishedAt: new Date().toISOString(),
      error: null,
    },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// License
// ---------------------------------------------------------------------------

export interface LicenseFormData {
  customerName: string;
  customerEmail: string;
  pricePaid: string;
  notes: string;
}

export function buildLicenseFormData(overrides: Partial<LicenseFormData> = {}): LicenseFormData {
  const ts = Date.now();
  return {
    customerName: `Test Customer ${ts}`,
    customerEmail: `test-${ts}@example.com`,
    pricePaid: '250.00',
    notes: 'E2E test license',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Gate auth
// ---------------------------------------------------------------------------

export const GATE_CREDENTIALS = {
  correct: process.env.SITE_PASSWORD ?? 'testpassword',
  wrong: 'completely_wrong_password_xyz',
};

// ---------------------------------------------------------------------------
// Upload test video (a tiny valid .mp4 in memory — 1-frame video)
// This base-64 is a 32-byte minimal ftyp+mdat MP4 that browsers accept.
// For real upload tests the /api/upload endpoint is mocked.
// ---------------------------------------------------------------------------

export const TINY_MP4_BASE64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0';

export function buildTinyMp4Buffer(): Buffer {
  return Buffer.from(TINY_MP4_BASE64, 'base64');
}

// Minimal .mp4 file name patterns the parser recognises
export const UPLOAD_FILENAMES = {
  aurora: 'aurora_lose_yourself_eminem.mp4',
  mono: 'mono_blinding_lights_the_weeknd.mp4',
  onyx: 'onyx_bohemian_rhapsody_queen.mp4',
} as const;
