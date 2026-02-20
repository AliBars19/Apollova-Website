# Apollova - Automated Video Publisher

A full-stack Next.js application that automates the publishing of music videos to TikTok and YouTube with intelligent caption generation, scheduled posting, and 24/7 automation support.

---

## 🎯 Overview

**Macbook Apollova** is a sophisticated automated video publishing system designed to streamline content distribution across social media platforms. The application intelligently parses video filenames, generates platform-specific captions with hashtags, and schedules posts throughout the day—all without manual intervention.

### Core Features

- 🎬 **Intelligent Filename Parsing** - Automatically extracts song title and artist from filenames
- 💬 **Auto-Caption Generation** - Creates hashtag-optimized captions for maximum reach
- ⏰ **Scheduled Publishing** - Posts 12 videos daily at hourly intervals (11 AM - 10 PM)
- 🔐 **OAuth Authentication** - Secure integration with YouTube and TikTok APIs
- 📊 **Dual-Platform Tracking** - Independent status monitoring for each platform
- 🔄 **Automatic Token Refresh** - Maintains authentication without manual intervention
- 🎨 **Modern Dashboard UI** - Clean, responsive interface for video management
- 🖥️ **24/7 Automation** - Raspberry Pi support for continuous background operation
- 📤 **Bulk Upload & Scheduling** - Manage hundreds of videos at once

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and modern features
- **TypeScript** - Full type-safe development
- **React 19** - Latest React with built-in compiler support
- **Tailwind CSS** (via globals.css) - Responsive styling

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - JavaScript runtime
- **node-cron v4.2.1** - Scheduled task execution
- **form-data v4.0.5** - Multipart form handling for uploads

### External Services & APIs
- **YouTube Data API v3** - Video uploads and metadata management
- **TikTok Content API** - Video uploads with caption and scheduling
- **OAuth 2.0** - Secure user authentication
- **Filesystem (JSON)** - Persistent metadata storage

### Deployment & Infrastructure
- **Vercel** - Web hosting, serverless functions, and SSL
- **Raspberry Pi** - 24/7 local automation and background jobs (production)

---

## 📁 Project Structure

```
Macbook-Apollova-Website/
├── README.md                              # Root README
├── Macbook-Apollova-Package/
│   ├── 3D Apple Music.aep                # After Effects project file
│   └── Activation.jsx                    # Activation/licensing script
│
└── apollova/                              # Main Next.js Application
    ├── package.json                       # Dependencies and scripts
    ├── next.config.ts                     # Next.js configuration
    ├── tsconfig.json                      # TypeScript configuration
    ├── eslint.config.mjs                 # ESLint configuration
    ├── next-env.d.ts                     # Next.js TypeScript definitions
    ├── README.md                          # Next.js template README
    │
    ├── data/                              # Data storage
    │   ├── videos.json                    # Video metadata database
    │   └── tokens.json                    # OAuth tokens (gitignored)
    │
    ├── public/
    │   └── uploads/                       # Video file storage
    │
    └── src/
        ├── middleware.ts                  # Next.js middleware for auth
        │
        ├── app/
        │   ├── globals.css                # Global styles
        │   ├── layout.tsx                 # Root layout
        │   ├── page.tsx                   # Homepage
        │   ├── types.ts                   # TypeScript interfaces
        │   │
        │   ├── api/
        │   │   ├── auth/
        │   │   │   ├── youtube/
        │   │   │   │   ├── authorise/
        │   │   │   │   │   └── route.ts   # YouTube OAuth initiation
        │   │   │   │   └── callback/      # YouTube OAuth callback
        │   │   │   ├── tiktok/
        │   │   │   │   ├── authorise/
        │   │   │   │   │   └── route.ts   # TikTok OAuth initiation
        │   │   │   │   └── callback/      # TikTok OAuth callback
        │   │   │   ├── gate/
        │   │   │   │   └── route.ts       # Authentication gate/check
        │   │   │   ├── status/
        │   │   │   │   └── route.ts       # Auth status endpoint
        │   │   │   └── logout/
        │   │   │       └── route.ts       # Logout endpoint
        │   │   │
        │   │   ├── upload/
        │   │   │   └── route.ts           # Video upload endpoint
        │   │   │
        │   │   ├── videos/
        │   │   │   ├── route.ts           # GET all videos, POST new videos
        │   │   │   ├── [id]/
        │   │   │   │   ├── route.ts       # GET/PUT/DELETE specific video
        │   │   │   │   └── publish/
        │   │   │   │       └── route.ts   # Publish video endpoint
        │   │   │   ├── bulk-schedule/
        │   │   │   │   └── route.ts       # Bulk schedule videos
        │   │   │   └── stream/
        │   │   │       └── [filename]/
        │   │   │           └── route.ts   # Stream video files
        │   │   │
        │   │   ├── scheduler/
        │   │   │   ├── check/
        │   │   │   │   └── route.ts       # Check scheduled videos
        │   │   │   └── start/
        │   │   │       └── route.ts       # Start scheduler
        │   │   │
        │   │   └── tiktok/
        │   │       └── creator-info/
        │   │           └── route.ts       # Get creator info
        │   │
        │   ├── components/
        │   │   ├── Navbar.tsx             # Navigation component
        │   │   ├── Footer.tsx             # Footer component
        │   │   ├── VideoCard.tsx          # Video display card
        │   │   ├── LogoutButton.tsx       # Auth logout button
        │   │   ├── ConnectionStatus.tsx   # Platform connection status
        │   │   ├── TikTokPublishDrawer.tsx # TikTok publishing drawer
        │   │   └── BulkScheduleButton.tsx # Bulk schedule button
        │   │
        │   ├── dashboard/
        │   │   └── page.tsx               # Main dashboard page
        │   │
        │   ├── upload/
        │   │   └── page.tsx               # Video upload page
        │   │
        │   ├── login/
        │   │   └── page.tsx               # Authentication page
        │   │
        │   ├── about/
        │   │   └── page.tsx               # About page
        │   │
        │   ├── gate/
        │   │   └── page.tsx               # Auth gate/check page
        │   │
        │   ├── auth-success/
        │   │   └── page.tsx               # OAuth success redirect page
        │   │
        │   ├── privacy-policy/
        │   │   └── page.tsx               # Privacy policy page
        │   │
        │   └── terms-of-service/
        │       └── page.tsx               # Terms of service page
        │
        └── utils/
            ├── fileParser.ts              # Parse filenames to title/artist
            ├── scheduler.ts               # Main scheduler logic
            ├── schedulerHelper.ts         # Scheduler utility functions
            ├── tokenManager.ts            # OAuth token management
            ├── videoOptimizer.ts          # Video optimization utilities
            ├── tiktok.ts                  # TikTok API utilities
            └── youtube.ts                 # YouTube API utilities
```

---

## 🔧 Installation & Setup

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **npm or yarn** - Package manager
- **YouTube API Credentials** - For uploading to YouTube
  - Google Cloud Project with YouTube Data API v3 enabled
  - OAuth 2.0 credentials (Client ID and Secret)
- **TikTok API Credentials** - For uploading to TikTok
  - TikTok Content API access (requires business approval)
  - API key and secret
- **Git** - Version control
- **Optional: Raspberry Pi** - For 24/7 local automation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Macbook-Apollova-Website.git
cd Macbook-Apollova-Website/apollova
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the `apollova` directory with the following:

```env
# YouTube API
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/callback/youtube

# TikTok API
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/callback/tiktok

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Set Up Data Directory

Ensure the data directory exists and has proper permissions:

```bash
mkdir -p data
touch data/videos.json data/tokens.json
echo "[]" > data/videos.json
echo "{}" > data/tokens.json
```

### Step 5: Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in your browser to see the application.

---

## 📖 How It Works

### Video Publishing Workflow

1. **Upload Videos** (Upload Page)
   - User uploads video files (MP4, MOV, AVI, MKV)
   - Filename format: `Song Title - Artist Name.mp4`
   - Application parses filename automatically

2. **Auto-Caption Generation** (fileParser.ts)
   - Title and artist extracted from filename
   - Captions generated with relevant hashtags (#fyp, #musica, #macbook)
   - Different captions for TikTok vs YouTube

3. **Schedule Videos** (scheduler.ts)
   - Videos scheduled for 12 hourly posts per day (11 AM - 10 PM)
   - Cron jobs created for each scheduled time
   - Stored in `data/videos.json`

4. **Auto-Publish** (scheduler.ts)
   - Scheduled times trigger automatic publishing
   - Videos published to both TikTok and YouTube simultaneously
   - Individual platform status tracking

5. **Token Management** (tokenManager.ts)
   - OAuth tokens automatically refreshed
   - Tokens stored securely in `data/tokens.json`
   - Automatic refresh before expiration

### Key Components

#### fileParser.ts
- **parseFilename()** - Extracts title and artist from filename
- **generateCaption()** - Creates platform-optimized captions with hashtags

#### scheduler.ts
- **startScheduler()** - Initializes cron jobs for scheduled videos
- **publishVideo()** - Publishes to TikTok and YouTube
- **checkScheduledVideos()** - Checks for videos ready to publish

#### tokenManager.ts
- **getTokens()** - Retrieves stored OAuth tokens
- **saveTokens()** - Securely saves OAuth tokens
- **refreshToken()** - Refreshes expired tokens

#### youtube.ts
- **uploadToYouTube()** - Uploads video and metadata to YouTube
- **getYouTubeToken()** - Retrieves YouTube OAuth token

#### tiktok.ts
- **uploadToTikTok()** - Uploads video and caption to TikTok
- **getTikTokToken()** - Retrieves TikTok OAuth token

---

## 🚀 Usage Guide

### Logging In

1. Navigate to `/login`
2. Choose platform: YouTube or TikTok
3. Authenticate with your account
4. Tokens are automatically saved

### Uploading Videos

1. Go to Dashboard → Upload
2. Select video files (supports batch upload)
3. Filenames must follow format: `Title - Artist.mp4`
4. Click "Upload" - metadata is auto-extracted

### Scheduling Videos

1. On Dashboard, videos appear after upload
2. Click "Schedule" to set publishing times
3. Choose times or use "Auto-Schedule" (11 AM - 10 PM daily)
4. Videos publish automatically at scheduled times

### Monitoring Status

- Dashboard shows real-time publication status
- Connection Status panel shows API authentication status
- Individual video cards show TikTok/YouTube status
- Failed uploads display error messages

### Bulk Operations

- Use "Bulk Schedule" to schedule multiple videos at once
- Select videos and choose scheduling pattern
- Auto-spaces videos throughout the day

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/youtube/authorise` - Initiate YouTube OAuth
- `POST /api/auth/tiktok/authorise` - Initiate TikTok OAuth
- `GET /api/auth/callback/youtube` - YouTube OAuth callback
- `GET /api/auth/callback/tiktok` - TikTok OAuth callback
- `POST /api/auth/logout` - Logout and clear tokens
- `GET /api/auth/status` - Check authentication status

### Videos
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Create new video entry
- `GET /api/videos/[id]` - Get specific video
- `PUT /api/videos/[id]` - Update video metadata
- `DELETE /api/videos/[id]` - Delete video
- `POST /api/videos/[id]/publish` - Publish video
- `POST /api/videos/bulk-schedule` - Bulk schedule videos
- `GET /api/videos/stream/[filename]` - Stream video file

### Upload
- `POST /api/upload` - Upload video file

### Scheduler
- `POST /api/scheduler/start` - Start the scheduler
- `GET /api/scheduler/check` - Check scheduled videos

### Platform-Specific
- `GET /api/tiktok/creator-info` - Get TikTok creator info

---

## 🔐 Security Features

- **OAuth 2.0 Authentication** - Industry-standard secure authentication
- **Token Encryption** - Tokens stored securely (should be encrypted in production)
- **CORS Protection** - Configured API access
- **Input Validation** - Filename and metadata validation
- **Rate Limiting** - Prevents abuse (implement in production)
- **HTTPS/SSL** - Enforced on Vercel deployment

### Production Security Notes

For production deployment, implement:
- Encrypted token storage (use Vercel KV or similar)
- Environment variable secrets management
- API key rotation policies
- Request rate limiting
- CORS whitelist configuration
- Database backup strategy

---

## 📦 Build & Deployment

### Local Build

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Deploy to Raspberry Pi (24/7 Automation)

```bash
# SSH into Raspberry Pi
ssh pi@raspberry-pi-ip

# Clone repository
git clone https://github.com/yourusername/Macbook-Apollova-Website.git
cd Macbook-Apollova-Website/apollova

# Install dependencies
npm install

# Create systemd service for 24/7 running
sudo nano /etc/systemd/system/macbook-apollova.service
```

Add the following to the service file:
```ini
[Unit]
Description=Macbook Apollova Video Scheduler
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Macbook-Apollova-Website/apollova
ExecStart=/usr/bin/node /usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable macbook-apollova
sudo systemctl start macbook-apollova
```

---

## 🎨 Customization

### Modify Posting Schedule

Edit [src/utils/schedulerHelper.ts](src/utils/schedulerHelper.ts) to change the default posting times:

```typescript
const scheduleTimes = [
  '0 11 * * *', // 11 AM
  '0 12 * * *', // 12 PM
  // Add more times...
];
```

### Customize Caption Templates

Edit [src/utils/fileParser.ts](src/utils/fileParser.ts) to change caption format:

```typescript
export function generateCaption(title: string, artist: string): string {
  return `${title} - ${artist} #custom #hashtags`;
}
```

### Style Customization

Modify [src/app/globals.css](src/app/globals.css) for theme and styling changes.

### Add New Pages

Create new folders in [src/app](src/app) following Next.js App Router conventions.

---

## 🐛 Troubleshooting

### Issue: "OAuth Token Expired"
**Solution**: Tokens auto-refresh, but you may need to re-authenticate:
1. Go to `/login`
2. Re-authorize with the platform
3. Tokens will be updated

### Issue: "Video Upload Failed"
**Solution**:
- Check filename format: `Title - Artist.ext`
- Verify file size limits (TikTok: 500MB, YouTube: 256GB)
- Check available disk space in `public/uploads/`

### Issue: "Scheduled Videos Not Publishing"
**Solution**:
- Ensure scheduler is running: `GET /api/scheduler/check`
- Check [data/videos.json](data/videos.json) for scheduled entries
- Verify API credentials are still valid
- Check server logs for errors

### Issue: "TikTok API Returns 401"
**Solution**:
- Re-authenticate with TikTok at `/login`
- Verify API credentials in `.env.local`
- Check that TikTok account has Business Account status

### Issue: "Cannot Access Dashboard"
**Solution**:
- Clear browser cookies
- Go to `/login` and authenticate
- Check that tokens are saved in [data/tokens.json](data/tokens.json)

---

## 📊 Data Structure

### videos.json Format

```json
[
  {
    "id": "video-uuid-123",
    "filename": "Song Title - Artist Name.mp4",
    "url": "/uploads/Song Title - Artist Name.mp4",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "scheduledAt": "2024-01-15T11:00:00Z",
    "status": "published",
    "tiktok": {
      "caption": "Song Title - Artist Name #fyp #musica",
      "status": "published",
      "videoId": "tiktok_video_id",
      "publishedAt": "2024-01-15T11:05:00Z"
    },
    "youtube": {
      "title": "Song Title - Artist Name",
      "description": "Check out this music video...",
      "tags": ["music", "artist"],
      "category": "Music",
      "privacy": "public",
      "status": "published",
      "videoId": "youtube_video_id",
      "publishedAt": "2024-01-15T11:03:00Z"
    }
  }
]
```

### tokens.json Format (Sensitive - Never commit)

```json
{
  "youtube": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": "2024-02-15T10:30:00Z"
  },
  "tiktok": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": "2024-02-15T10:30:00Z"
  }
}
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

This project is private and proprietary. Unauthorized copying or distribution is prohibited.

---

## 📞 Support & Contact

For issues, questions, or feature requests:
- Create an issue in the GitHub repository
- Contact the development team

---

## 🎬 Additional Resources

### Macbook-Apollova-Package

The `Macbook-Apollova-Package` folder contains:
- **3D Apple Music.aep** - After Effects project for video templates
- **Activation.jsx** - Licensing/activation script for the project

These can be used to create consistent video templates with Apple design aesthetics.

### File Format Guidelines

**Recommended Video Format for Uploads:**
- Codec: H.264
- Resolution: 1080x1920 (vertical for TikTok), 1280x720 (16:9 for YouTube)
- Frame Rate: 30fps or 60fps
- Audio: AAC, 128kbps minimum

**Filename Format (CRITICAL):**
```
Song Title - Artist Name.mp4
```

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone and setup
git clone <repo-url>
cd apollova
npm install

# 2. Configure
cp .env.local.example .env.local
# Edit .env.local with your API credentials

# 3. Run
npm run dev

# 4. Visit http://localhost:3000
```

---

**Macbook Apollova** - Automate your music video publishing today! 🎵📱
