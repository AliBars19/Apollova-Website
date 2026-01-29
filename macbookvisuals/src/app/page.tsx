"use client";

import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
        paddingTop: '80px',
      }}>
        {/* Hero Section */}
        <section style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 72px)',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            MacBook Visuals
          </h1>
          
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            color: '#fff',
            marginBottom: '16px',
            fontWeight: '600',
          }}>
            Professional After Effects Template
          </h2>

          <p style={{
            color: '#aaa',
            marginBottom: '48px',
            fontSize: '18px',
            maxWidth: '600px',
            lineHeight: '1.8',
          }}>
            Create stunning music visualizations in minutes. The same template used 
            by top creators to generate millions of views.
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <a
              href="mailto:contact@macbookvisuals.com?subject=Purchase MacBook Visuals Template"
              style={{
                padding: '18px 48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              }}
            >
              Get Template
            </a>
          </div>

          <p style={{
            color: '#666',
            fontSize: '14px',
            marginTop: '24px',
          }}>
            One-time payment • Lifetime updates • Instant delivery
          </p>
        </section>

        {/* TODO: Add more sections as needed */}
        {/* Features, Stats, Testimonials, CTA, etc. */}
        
      </main>
      <PublicFooter />
    </>
  );
}
