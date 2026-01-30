"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import Link from 'next/link';

export default function HomePage() {
  const { theme, colors } = useTheme();

  // Template cards data - EDIT THESE
  const templates = [
    {
      href: '/templates/template-1',
      // Replace with your actual image path in /public folder
      image: '/images/template-1-preview.jpg',
      title: 'Template One',
      description: 'A stunning visual experience that transforms your music into captivating animations, designed for maximum engagement.',
    },
    {
      href: '/templates/template-2',
      image: '/images/template-2-preview.jpg',
      title: 'Template Two',
      description: 'Dynamic lyric visualizations with fluid motion and modern aesthetics, perfect for social media platforms.',
    },
    {
      href: '/templates/template-3',
      image: '/images/template-3-preview.jpg',
      title: 'Template Three',
      description: 'Minimalist elegance meets powerful impact, creating content that resonates with audiences worldwide.',
    },
  ];

  return (
    <>
      <PublicNavbar />
      <main style={{
        minHeight: '100vh',
        background: colors.background,
        transition: 'all 0.3s ease',
      }}>
        {/* Hero Section - Full Screen Video */}
        <section style={{
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Video Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'cover',
            }}
          >
            {/* Replace with your promo video in /public folder */}
            <source src="/videos/hero-promo.mp4" type="video/mp4" />
          </video>

          {/* Optional overlay for text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
          }} />

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            animation: 'bounce 2s infinite',
          }}>
            <span style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Scroll
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Templates Section */}
        <section style={{
          padding: '120px 40px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {/* Section Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}>
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '16px',
              letterSpacing: '-1px',
            }}>
              Pioneers of Lyric Content
            </h2>
            <p style={{
              color: colors.textSecondary,
              fontSize: '16px',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.8',
            }}>
              Professional templates designed to transform your music into viral visual content.
            </p>
          </div>

          {/* Template Cards - Soneva Style (no borders, clean) */}
          {/* LOCATION: Edit the 'templates' array at the top of this file */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px',
          }}>
            {templates.map((template, index) => (
              <Link 
                key={index}
                href={template.href}
                style={{ textDecoration: 'none' }}
              >
                <article style={{
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Image Container */}
                  <div style={{
                    aspectRatio: '4/5',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    background: colors.backgroundSecondary,
                  }}>
                    {/* Replace src with actual images */}
                    <img
                      src={template.image}
                      alt={template.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onError={(e) => {
                        // Placeholder if image not found
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: '400',
                    color: colors.text,
                    marginBottom: '12px',
                    letterSpacing: '-0.5px',
                  }}>
                    {template.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: colors.textSecondary,
                    fontSize: '14px',
                    lineHeight: '1.7',
                    marginBottom: '16px',
                  }}>
                    {template.description}
                  </p>

                  {/* Discover Link */}
                  <span style={{
                    color: colors.text,
                    fontSize: '14px',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                  }}>
                    Discover
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Enquiries Section */}
        <section style={{
          padding: '100px 40px',
          background: colors.backgroundSecondary,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'center',
          }}>
            {/* Left: Description */}
            <div>
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: '300',
                color: colors.text,
                marginBottom: '24px',
                letterSpacing: '-1px',
              }}>
                Enquiries
              </h2>
              <p style={{
                color: colors.textSecondary,
                fontSize: '16px',
                lineHeight: '1.8',
                marginBottom: '16px',
              }}>
                Have questions about our templates or need custom solutions? We'd love to hear from you. 
                Whether you're looking for licensing information, technical support, or partnership opportunities, 
                our team is here to help.
              </p>
              <p style={{
                color: colors.textSecondary,
                fontSize: '16px',
                lineHeight: '1.8',
              }}>
                Response time: Within 24 hours.
              </p>
            </div>

            {/* Right: Contact CTA */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '24px',
            }}>
              <p style={{
                color: colors.textSecondary,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                Get in touch
              </p>
              <a
                href="mailto:contact@macbookvisuals.com?subject=Inquiry about MacBook Visuals"
                style={{
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  color: colors.text,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${colors.text}`,
                  paddingBottom: '8px',
                  transition: 'all 0.3s ease',
                }}
              >
                contact@macbookvisuals.com
              </a>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />

      {/* CSS Animation for scroll indicator */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }
      `}</style>
    </>
  );
}
