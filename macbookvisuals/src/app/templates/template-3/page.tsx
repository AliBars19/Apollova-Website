"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';

export default function Template3Page() {
  const { theme, colors } = useTheme();

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
          padding: '120px 40px 80px',
          gap: '48px',
        }}>
          {/* Phone Frame with Video */}
          <div style={{
            width: '320px',
            height: '640px',
            borderRadius: '40px',
            overflow: 'hidden',
            boxShadow: theme === 'light' 
              ? '0 40px 80px rgba(0,0,0,0.15)' 
              : '0 40px 80px rgba(0,0,0,0.5)',
            border: `8px solid ${theme === 'light' ? '#1a1a1a' : '#333'}`,
            background: '#000',
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

          {/* Title & Description below phone */}
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
          }}>
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '24px',
              letterSpacing: '-1px',
            }}>
              Template Three
            </h1>
            <p style={{
              color: colors.textSecondary,
              fontSize: '17px',
              lineHeight: '1.9',
            }}>
              {/* EDIT: Your template 3 description */}
              Minimalist elegance meets powerful impact. This template strips away the 
              unnecessary to focus on what matters most: your music and message. 
              Creating content that resonates deeply with audiences worldwide.
            </p>
          </div>
        </section>

        {/* Stats/Social Proof Bar */}
        <section style={{
          padding: '60px 40px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px',
            textAlign: 'center',
          }}>
            {[
              { number: '50M+', label: 'Views Generated' },
              { number: '500+', label: 'Creators Using' },
              { number: '4.9★', label: 'Average Rating' },
            ].map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '300',
                  color: colors.text,
                  marginBottom: '8px',
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: '14px',
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

        {/* Feature Cards - Grid */}
        <section style={{
          padding: '100px 40px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '48px',
          }}>
            {features.map((feature, index) => (
              <div key={index}>
                <div style={{
                  aspectRatio: '1/1',
                  overflow: 'hidden',
                  marginBottom: '24px',
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
                  fontSize: '20px',
                  fontWeight: '500',
                  color: colors.text,
                  marginBottom: '12px',
                }}>
                  {feature.title}
                </h3>
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

        {/* Enquiries Section - Full Width */}
        <section style={{
          padding: '120px 40px',
          background: theme === 'light' 
            ? colors.text 
            : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: '300',
              color: '#fff',
              marginBottom: '24px',
            }}>
              Let's create something beautiful
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '16px',
              lineHeight: '1.8',
              marginBottom: '40px',
            }}>
              Ready to elevate your content? Get in touch to discuss licensing options.
            </p>
            <a
              href="mailto:contact@macbookvisuals.com?subject=Inquiry about Template Three"
              style={{
                display: 'inline-block',
                padding: '18px 48px',
                background: '#fff',
                color: colors.text,
                textDecoration: 'none',
                fontSize: '15px',
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
