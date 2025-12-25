#  Macbook Visuals - Automated Video Publisher

A full-stack Next.js application that automates the publishing of music videos to TikTok and YouTube with intelligent caption generation and scheduled posting.

---
##  Overview

Macbook Visuals is an automated video publishing system designed to streamline content distribution across social media platforms. The application intelligently parses video filenames, generates platform-specific captions with hashtags, and schedules posts throughout the day—all without manual intervention.

### Key Features

-  **Intelligent Filename Parsing** - Automatically extracts song title and artist from filenames
-  **Auto-Caption Generation** - Creates hashtag-optimized captions for maximum reach
-  **Scheduled Publishing** - Posts 12 videos daily at hourly intervals (11 AM - 10 PM)
-  **OAuth Authentication** - Secure integration with YouTube and TikTok APIs
-  **Dual-Platform Tracking** - Independent status monitoring for each platform
-  **Automatic Token Refresh** - Maintains authentication without manual intervention
-  **Modern UI** - Clean, responsive dashboard for video management

---

##  Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **React** - Component-based UI

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - JavaScript runtime
- **node-cron** - Scheduled task execution

### Storage & APIs
- **Filesystem** - JSON-based metadata storage
- **YouTube Data API v3** - Video uploads to YouTube
- **TikTok Content API** - Video uploads to TikTok
- **OAuth 2.0** - Secure authentication

### Deployment
- **Vercel** - Web hosting and SSL
- **Raspberry Pi** - 24/7 local automation (production)

---

##  Project Structure

```
macbookvisuals/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── youtube/authorize/     # YouTube OAuth
│   │   │   │   ├── callback/youtube/      # OAuth callback
│   │   │   │   ├── status/                # Auth status check
│   │   │   │   └── logout/                # Logout endpoint
│   │   │   ├── upload/                    # Video upload
│   │   │   └── videos/
│   │   │       ├── route.ts               # Get all videos
│   │   │       └── [id]/
│   │   │           ├── route.ts           # Update/delete video
│   │   │           └── publish/           # Publish endpoint
│   │   ├── components/
│   │   │   ├── VideoCard.tsx              # Video display card
│   │   │   └── LogoutButton.tsx           # Auth logout
│   │   ├── dashboard/                     # Main dashboard
│   │   ├── login/                         # Authentication page
│   │   ├── upload/                        # Upload interface
│   │   └── types.ts                       # TypeScript definitions
│   ├── lib/
│   │   ├── tokenManager.ts                # OAuth token management
│   │   └── scheduler.ts                   # Cron job scheduler
│   └── utils/
│       ├── fileParser.ts                  # Filename parsing
│       └── scheduleHelper.ts              # Schedule generation
├── data/
│   ├── videos.json                        # Video metadata
│   └── tokens.json                        # OAuth tokens (gitignored)
└── public/
    └── uploads/                           # Video file storage
```

---

## 🔧 Installation

### Prerequisites

- Node.js 18+ and npm
- YouTube API credentials
- TikTok API credentials (requires approval)
- Custom domain (optional, for TikTok compliance)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/macbookvisuals.git
   cd macbookvisuals
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Add your API credentials:
   ```env
   # YouTube API
   YOUTUBE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   YOUTUBE_CLIENT_SECRET=your-client-secret

   # TikTok API 
   TIKTOK_CLIENT_KEY=your-client-key
   TIKTOK_CLIENT_SECRET=your-client-secret
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

---

##  Usage

### Initial Setup

1. **Authorize Platforms**
   - Navigate to `/login`
   - Click "Connect with YouTube"
   - Grant OAuth permissions
   - Do the same for tiktok

2. **Upload Videos**
   - Name files: `"Song Title - Artist.mp4"`
   - Upload via `/upload` page
   - Caption auto-generates: `"Song Title - Artist #fyp #musica #macbook #SongTitle #Artist"`

3. **Schedule Publishing**
   - Set schedule time in dashboard
   - System posts at specified time
   - Tracks status per platform

### Filename Format

Videos must follow this naming convention:
```
Song Title - Artist.mp4
```

**Examples:**
- :) `Blinding Lights - The Weeknd.mp4`
- :) `Levitating - Dua Lipa.mp4`
- :( `my-video.mp4` (won't parse correctly)

### Auto-Generated Captions

Input: `"Blinding Lights - The Weeknd.mp4"`

Output:
```
Blinding Lights - The Weeknd #fyp #musica #macbook #BlindingLights #TheWeeknd
```

---

##  Scheduling System

The application posts **12 videos daily** from 11 AM to 10 PM (one per hour):

```
11:00 AM → Video 1
12:00 PM → Video 2
 1:00 PM → Video 3
   ...
10:00 PM → Video 12

```

Scheduler checks every 5 minutes for pending videos and publishes automatically.

---
## Authentication Flow

```
User → Login Page → OAuth Consent → Platform Authorization
                                            ↓
                                      Access Token
                                            ↓
                                    Auto-Refresh System
                                            ↓
                                      API Publishing
```

Tokens are:
- Stored securely in `data/tokens.json`
- Auto-refreshed when expired
- Never exposed to client-side code

---

##  Video Lifecycle

```
Upload → Parse Filename → Generate Caption → Store Metadata
                                                    ↓
                                            Schedule (Optional)
                                                    ↓
                                        Publish to TikTok & YouTube
                                                    ↓
                                    Track Status Per Platform
```

Each video tracks:
- Overall status: `draft`, `scheduled`, `publishing`, `published`, `failed`
- Platform-specific status for TikTok and YouTube
- Platform video IDs after successful upload
- Error messages if upload fails

---

##  Security

- OAuth tokens stored server-side only
- `.env.local` and `tokens.json` in `.gitignore`
- No sensitive data exposed to client
- HTTPS required for production (via Vercel)
- API routes validate authentication
- Terms of Service and Privacy Policy pages public (compliance)

---

##  Roadmap

- [ ] **Error Recovery** - Retry failed uploads automatically
- [ ] **Analytics Dashboard** - View engagement metrics
- [ ] **Multi-Account Support** - Manage multiple TikTok/YouTube channels
- [ ] **Video Editing** - Built-in trimming and filters
- [ ] **Cloud Storage** - Optional AWS S3 integration
- [ ] **Email Notifications** - Alerts for failed uploads
- [ ] **Thumbnail Generation** - Auto-create video thumbnails
- [ ] **Advanced Scheduling** - Custom posting schedules per day

---

##  Contributing

Contributions are welcome

---

##  Author

**Ali Bars**
- Website: [macbookvisuals.com](https://macbookvisuals.com)
- GitHub: [@AliBars19](https://github.com/AliBars19)

---

##  Acknowledgments

- Next.js team for the amazing framework
- YouTube and TikTok for their APIs
- The open-source community

---

##  Support

For issues and questions:
- Open an issue on GitHub
- Email: support@macbookvisuals.com
- Visit: [macbookvisuals.com/about](https://macbookvisuals.com/about)

---

**Built with love for content creators**