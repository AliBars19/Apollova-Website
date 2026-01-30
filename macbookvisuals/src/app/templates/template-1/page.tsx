"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';

export default function Template1Page() {
  const { theme, colors } = useTheme();

  // Feature cards data - EDIT THESE
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
        {/* Hero Video - Full Width */}
        <section style={{
          height: '80vh',
          position: 'relative',
          overflow: 'hidden',
          marginTop: '70px',
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
            {/* Replace with your template 1 promo video */}
            <source src="/videos/template-1-promo.mp4" type="video/mp4" />
          </video>
        </section>

        {/* Description Section */}
        <section style={{
          padding: '100px 40px',
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '32px',
            letterSpacing: '-1px',
          }}>
            Template One
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: '18px',
            lineHeight: '1.9',
            marginBottom: '24px',
          }}>
            {/* EDIT: Add your template description here */}
            A stunning visual experience that transforms your music into captivating animations. 
            Designed for maximum engagement across all social media platforms, this template 
            combines elegant typography with fluid motion to create content that stands out.
          </p>
          <p style={{
            color: colors.textSecondary,
            fontSize: '16px',
            lineHeight: '1.8',
          }}>
            Perfect for TikTok, Instagram Reels, and YouTube Shorts. No plugins required.
          </p>
        </section>

        {/* Feature Cards */}
        <section style={{
          padding: '60px 40px 120px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '48px',
          }}>
            {features.map((feature, index) => (
              <div key={index}>
                {/* Image */}
                <div style={{
                  aspectRatio: '16/10',
                  overflow: 'hidden',
                  marginBottom: '24px',
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
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '500',
                  color: colors.text,
                  marginBottom: '12px',
                }}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p style={{
                  color: colors.textSecondary,
                  fontSize: '14px',
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
          padding: '100px 40px',
          background: colors.backgroundSecondary,
          transition: 'all 0.3s ease',
        }}>
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'center',
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: '300',
                color: colors.text,
                marginBottom: '24px',
              }}>
                Interested in Template One?
              </h2>
              <p style={{
                color: colors.textSecondary,
                fontSize: '16px',
                lineHeight: '1.8',
              }}>
                Get in touch to learn about licensing options, pricing, and how this template 
                can elevate your content creation.
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <p style={{
                color: colors.textSecondary,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                Enquire now
              </p>
              <a
                href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template One"
                style={{
                  fontSize: 'clamp(20px, 2.5vw, 28px)',
                  color: colors.text,
                  textDecoration: 'none',
                  borderBottom: `1px solid ${colors.text}`,
                  paddingBottom: '8px',
                  display: 'inline-block',
                  width: 'fit-content',
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
