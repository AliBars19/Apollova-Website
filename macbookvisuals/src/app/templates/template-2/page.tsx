"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { useState, useEffect } from 'react';

export default function Template2Page() {
  const { theme, colors } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        {/* Hero - Split Screen / Stacked on mobile */}
        <section style={{
          minHeight: isMobile ? 'auto' : '100vh',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          marginTop: '60px',
        }}>
          {/* Video */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            height: isMobile ? '50vh' : 'auto',
            minHeight: isMobile ? '300px' : 'auto',
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

          {/* Text Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isMobile ? '40px 20px' : '60px',
            background: colors.backgroundSecondary,
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '24px',
              letterSpacing: '-1px',
            }}>
              Template Two
            </h1>
            <p style={{
              color: colors.textSecondary,
              fontSize: 'clamp(15px, 2vw, 17px)',
              lineHeight: '1.9',
              marginBottom: '20px',
            }}>
              Dynamic lyric visualizations with fluid motion and modern aesthetics. 
              This template brings your music to life with elegant transitions.
            </p>
            <p style={{
              color: colors.textSecondary,
              fontSize: 'clamp(14px, 2vw, 15px)',
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              Engineered for virality. Built for creators who demand excellence.
            </p>

            <a
              href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template Two"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
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

        {/* Feature Cards */}
        <section style={{
          padding: 'clamp(60px, 10vw, 120px) 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {features.map((feature, index) => (
            <div 
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? '24px' : '60px',
                alignItems: 'center',
                marginBottom: index < features.length - 1 ? 'clamp(48px, 8vw, 100px)' : 0,
              }}
            >
              {/* Image */}
              <div style={{ order: isMobile ? 1 : (index % 2 === 0 ? 1 : 2) }}>
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
              <div style={{ order: isMobile ? 2 : (index % 2 === 0 ? 2 : 1) }}>
                <h3 style={{
                  fontSize: 'clamp(22px, 3vw, 28px)',
                  fontWeight: '400',
                  color: colors.text,
                  marginBottom: '16px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: 'clamp(14px, 2vw, 16px)',
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
          padding: 'clamp(60px, 10vw, 100px) 20px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 40px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '20px',
            }}>
              Ready to create?
            </h2>
            <p style={{
              color: colors.textSecondary,
              fontSize: 'clamp(14px, 2vw, 16px)',
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              Get in touch to discuss licensing and start creating viral content today.
            </p>
            <a
              href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template Two"
              style={{
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                color: colors.text,
                textDecoration: 'none',
                borderBottom: `1px solid ${colors.text}`,
                paddingBottom: '6px',
                wordBreak: 'break-all',
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
