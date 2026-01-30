"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';

export default function Template1Page() {
  const { theme, colors } = useTheme();

  const features = [
    {
      image: '/images/template-1-feature-1.png',
      title: 'Dynamic Animations',
      description: 'Fluid motion graphics that sync perfectly with your music beats and rhythm.',
    },
    {
      image: '/images/template-1-feature-2.png',
      title: 'Easy Customization',
      description: 'Change colors, fonts, and timing with simple control layers - no plugins required.',
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
        {/* Hero Video */}
        <section style={{
          height: 'clamp(50vh, 70vh, 80vh)',
          position: 'relative',
          overflow: 'hidden',
          marginTop: '60px',
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
            <source src="/videos/template-1-promo.mp4" type="video/mp4" />
          </video>
        </section>

        {/* Description Section */}
        <section style={{
          padding: 'clamp(60px, 10vw, 100px) 20px',
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '24px',
            letterSpacing: '-1px',
          }}>
            Template One
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            lineHeight: '1.9',
            marginBottom: '20px',
          }}>
            A stunning visual experience that transforms your music into captivating animations. 
            Designed for maximum engagement across all social media platforms.
          </p>
          <p style={{
            color: colors.textSecondary,
            fontSize: 'clamp(14px, 2vw, 16px)',
            lineHeight: '1.8',
          }}>
            Perfect for TikTok, Instagram Reels, and YouTube Shorts. No plugins required.
          </p>
        </section>

        {/* Feature Cards */}
        <section style={{
          padding: '40px 20px clamp(60px, 10vw, 120px)',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
          }}>
            {features.map((feature, index) => (
              <div key={index}>
                <div style={{
                  aspectRatio: '16/10',
                  overflow: 'hidden',
                  marginBottom: '20px',
                  background: colors.backgroundSecondary,
                  borderRadius: '4px',
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

        {/* Enquiries Section */}
        <section style={{
          padding: 'clamp(60px, 10vw, 100px) 20px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(32px, 6vw, 80px)',
            alignItems: 'center',
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(24px, 4vw, 40px)',
                fontWeight: '300',
                color: colors.text,
                marginBottom: '20px',
              }}>
                Interested in Template One?
              </h2>
              <p style={{
                color: colors.textSecondary,
                fontSize: 'clamp(14px, 2vw, 16px)',
                lineHeight: '1.8',
              }}>
                Get in touch to learn about licensing options and pricing.
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <p style={{
                color: colors.textSecondary,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                Enquire now
              </p>
              <a
                href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template One"
                style={{
                  fontSize: 'clamp(16px, 2.5vw, 24px)',
                  color: colors.text,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${colors.text}`,
                  paddingBottom: '6px',
                  display: 'inline-block',
                  width: 'fit-content',
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
    </>
  );
}
