export default function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <h1>MacbookVisuals</h1>
        <p className="home-subtitle">
          A local dashboard for managing, reviewing, and publishing short-form
          videos to TikTok.
        </p>

        <div className="home-actions">
          <a href="/dashboard" className="btn primary">
            Go to Dashboard
          </a>
          <a href="/upload" className="btn outline">
            Upload Videos
          </a>
        </div>
      </section>

      <section className="home-features">
        <div className="feature">
          <h3>Upload & Review</h3>
          <p>
            Upload one or multiple videos and review them before publishing.
            Nothing is posted automatically.
          </p>
        </div>

        <div className="feature">
          <h3>Caption & Schedule</h3>
          <p>
            Write captions, tweak hooks, and schedule posts exactly when you
            want them to go live.
          </p>
        </div>

        <div className="feature">
          <h3>Publish with Control</h3>
          <p>
            Publish videos directly via the TikTok Content API, with full
            control over timing and metadata.
          </p>
        </div>

        <div className = "feature">
          <h3>Fully Automated</h3>
          <p>
            Using a custom API, you can send videos from your own project,
            upload them and schedule to your needs.
          </p>
        </div>
      </section>
    </main>
  );
}
