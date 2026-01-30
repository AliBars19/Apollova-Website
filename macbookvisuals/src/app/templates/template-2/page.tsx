"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';

export default function Template2Page() {
  const { theme, colors } = useTheme();

  const features = [
    {
      image: '/images/template-2-feature-1.png',
      title: 'Social Media Optimized',
      description: 'Pre-configured for vertical 9:16 format, perfect for TikTok and Reels.',
    },
    {
      image: '/images/template-2-feature-2.png',
      title: 'Lyric Sync System',
      description: 'Advanced text animation that perfectly matches your song lyrics and timing.',
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
        {/* Hero - Split Screen Layout */}
        <section style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          marginTop: '70px',
        }}>
          {/* Left: Video */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
          }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            >
              <source src="/videos/template-2-promo.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Right: Text Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            background: colors.backgroundSecondary,
          }}>
            <h1 style={{
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '32px',
              letterSpacing: '-1px',
            }}>
              Template Two
            </h1>
            <p style={{
              color: colors.textSecondary,
              fontSize: '17px',
              lineHeight: '1.9',
              marginBottom: '24px',
            }}>
              {/* EDIT: Your template 2 description */}
              Dynamic lyric visualizations with fluid motion and modern aesthetics. 
              This template brings your music to life with elegant transitions and 
              eye-catching typography designed to capture attention in the first second.
            </p>
            <p style={{
              color: colors.textSecondary,
              fontSize: '15px',
              lineHeight: '1.8',
              marginBottom: '40px',
            }}>
              Engineered for virality. Built for creators who demand excellence.
            </p>

            <a
              href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template Two"
              style={{
                display: 'inline-block',
                padding: '16px 40px',
                background: theme === 'light' ? colors.text : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                color: theme === 'light' ? colors.background : '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                width: 'fit-content',
              }}
            >
              Enquire Now
            </a>
          </div>
        </section>

        {/* Feature Cards - Alternating Layout */}
        <section style={{
          padding: '120px 40px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {features.map((feature, index) => (
            <div 
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: index % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
                gap: '80px',
                alignItems: 'center',
                marginBottom: index < features.length - 1 ? '100px' : 0,
              }}
            >
              {/* Image - Alternates position */}
              <div style={{ order: index % 2 === 0 ? 1 : 2 }}>
                <div style={{
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  background: colors.backgroundSecondary,
                }}>
                  <img
                    src={feature.image}
                    alt={feature.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              </div>

              {/* Text */}
              <div style={{ order: index % 2 === 0 ? 2 : 1 }}>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '400',
                  color: colors.text,
                  marginBottom: '20px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: '16px',
                  lineHeight: '1.8',
                }}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Enquiries Section */}
        <section style={{
          padding: '100px 40px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '24px',
            }}>
              Ready to create?
            </h2>
            <p style={{
              color: colors.textSecondary,
              fontSize: '16px',
              lineHeight: '1.8',
              marginBottom: '40px',
            }}>
              Get in touch to discuss licensing and start creating viral content today.
            </p>
            <a
              href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template Two"
              style={{
                fontSize: '20px',
                color: colors.text,
                textDecoration: 'none',
                borderBottom: `1px solid ${colors.text}`,
                paddingBottom: '8px',
              }}
            >
              contact@macbookvisuals.com
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
