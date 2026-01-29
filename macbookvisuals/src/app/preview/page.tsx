"use client";

import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function PreviewPage() {
  return (
    <>
      <PublicNavbar />
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
        paddingTop: '100px',
        padding: '100px 20px 80px',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 56px)',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            Preview
          </h1>

          <p style={{
            color: '#aaa',
            fontSize: '18px',
            lineHeight: '1.8',
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            See the MacBook Visuals template in action.
          </p>

          {/* TODO: Add video previews, screenshots, etc. */}
          <div style={{
            padding: '48px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#888' }}>
              Add your preview content here (videos, screenshots, demos)...
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
