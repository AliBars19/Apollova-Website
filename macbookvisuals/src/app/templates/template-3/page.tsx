"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { useState, useEffect } from 'react';

export default function Template3Page() {
  const { theme, colors } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const features = [
    {
      image: '/images/template-3-feature-1.png',
      title: 'Minimalist Design',
      description: 'Clean aesthetics that let your music and lyrics take center stage.',
    },
    {
      image: '/images/template-3-feature-2.png',
      title: 'Universal Appeal',
      description: 'Timeless design language that works across all genres and audiences.',
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
        {/* Hero - Centered Phone/Vertical Video Style */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 20px 60px',
          gap: '36px',
        }}>
          {/* Phone Frame with Video */}
          <div style={{
            width: isMobile ? '240px' : '300px',
            height: isMobile ? '480px' : '600px',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: theme === 'light' 
              ? '0 30px 60px rgba(0,0,0,0.15)' 
              : '0 30px 60px rgba(0,0,0,0.5)',
            border: `6px solid ${theme === 'light' ? '#1a1a1a' : '#333'}`,
            background: '#000',
            flexShrink: 0,
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
              <source src="/videos/template-3-promo.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Title & Description */}
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            padding: '0 20px',
          }}>
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '20px',
              letterSpacing: '-1px',
            }}>
              Template Three
            </h1>
            <p style={{
              color: colors.textSecondary,
              fontSize: 'clamp(15px, 2.5vw, 17px)',
              lineHeight: '1.9',
            }}>
              Minimalist elegance meets powerful impact. Creating content 
              that resonates deeply with audiences worldwide.
            </p>
          </div>
        </section>

        {/* Stats Bar */}
        <section style={{
          padding: 'clamp(40px, 6vw, 60px) 20px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: isMobile ? '16px' : '40px',
            textAlign: 'center',
          }}>
            {[
              { number: '50M+', label: 'Views Generated' },
              { number: '500+', label: 'Creators Using' },
              { number: '4.9★', label: 'Average Rating' },
            ].map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontSize: isMobile ? '24px' : '36px',
                  fontWeight: '300',
                  color: colors.text,
                  marginBottom: '4px',
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: isMobile ? '10px' : '13px',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section style={{
          padding: 'clamp(60px, 10vw, 100px) 20px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
          }}>
            {features.map((feature, index) => (
              <div key={index}>
                <div style={{
                  aspectRatio: '1/1',
                  overflow: 'hidden',
                  marginBottom: '20px',
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
                <h3 style={{
                  fontSize: 'clamp(16px, 2.5vw, 20px)',
                  fontWeight: '500',
                  color: colors.text,
                  marginBottom: '10px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: 'clamp(13px, 2vw, 14px)',
                  lineHeight: '1.7',
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: 'clamp(80px, 12vw, 120px) 20px',
          background: theme === 'light' 
            ? colors.text 
            : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <h2 style={{
              fontSize: 'clamp(24px, 5vw, 44px)',
              fontWeight: '300',
              color: '#fff',
              marginBottom: '20px',
            }}>
              Let's create something beautiful
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 'clamp(14px, 2vw, 16px)',
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              Ready to elevate your content? Get in touch to discuss licensing options.
            </p>
            <a
              href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template Three"
              style={{
                display: 'inline-block',
                padding: '16px 40px',
                background: '#fff',
                color: '#1a1a1a',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
