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
      href: '/templates/Visuals Aurora',
      image: '/images/visuals-aurora-preview.jpg',
      title: 'Visuals Aurora',
      description: 'The core of our lyric content, infused into a virtual MacBook sets the level of quality for your content.',
    },
    {
      href: '/templates/Visuals Nova',
      image: '/images/visuals-nova-preview.jpg',
      title: 'Visuals Nova',
      description: 'Our most viral template yet, revitalising musics two most iconic formats into a visual masterpiece.',
    },
    {
      href: '/templates/Visuals Onyx',
      image: '/images/visuals-onyx-preview.jpg',
      title: 'Visuals Onyx',
      description: 'Iconic, simple and viral are the only words for our most dynamic format.',
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
          minHeight: '500px',
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
            <source src="/videos/hero-promo.mp4" type="video/mp4" />
          </video>

          {/* Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
          }} />

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            animation: 'bounce 2s infinite',
          }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Scroll
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Templates Section */}
        <section style={{
          padding: 'clamp(60px, 10vw, 120px) 20px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          {/* Section Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'clamp(40px, 8vw, 80px)',
          }}>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '16px',
              letterSpacing: '-1px',
            }}>
              Pioneers of Lyric Content
            </h2>
            <p style={{
              color: colors.textSecondary,
              fontSize: 'clamp(14px, 2vw, 16px)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.8',
              padding: '0 20px',
            }}>
              Professional templates designed to transform your music into viral visual content.
            </p>
          </div>

          {/* Template Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(24px, 4vw, 40px)',
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
                }}>
                  {/* Image Container */}
                  <div style={{
                    aspectRatio: '4/5',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    background: colors.backgroundSecondary,
                  }}>
                    <img
                      src={template.image}
                      alt={template.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 'clamp(18px, 3vw, 24px)',
                    fontWeight: '400',
                    color: colors.text,
                    marginBottom: '10px',
                    letterSpacing: '-0.5px',
                  }}>
                    {template.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: colors.textSecondary,
                    fontSize: 'clamp(13px, 2vw, 14px)',
                    lineHeight: '1.7',
                    marginBottom: '12px',
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
          padding: 'clamp(60px, 10vw, 100px) 20px',
          background: colors.backgroundSecondary,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(32px, 6vw, 80px)',
            alignItems: 'center',
          }}>
            {/* Left: Description */}
            <div>
              <h2 style={{
                fontSize: 'clamp(24px, 4vw, 40px)',
                fontWeight: '300',
                color: colors.text,
                marginBottom: '20px',
                letterSpacing: '-1px',
              }}>
                Enquiries
              </h2>
              <p style={{
                color: colors.textSecondary,
                fontSize: 'clamp(14px, 2vw, 16px)',
                lineHeight: '1.8',
                marginBottom: '12px',
              }}>
                Have questions about our templates or need custom solutions? We'd love to hear from you.
              </p>
              <p style={{
                color: colors.textSecondary,
                fontSize: 'clamp(14px, 2vw, 16px)',
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
              gap: '16px',
            }}>
              <p style={{
                color: colors.textSecondary,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                Get in touch
              </p>
              <a
                href="mailto:contact@macbookvisuals.com?subject=Inquiry about MacBook Visuals"
                style={{
                  fontSize: 'clamp(18px, 3vw, 32px)',
                  color: colors.text,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${colors.text}`,
                  paddingBottom: '6px',
                  transition: 'all 0.3s ease',
                  wordBreak: 'break-all',
                }}
              >
                contact@macbookvisuals.com
              </a>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />

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
