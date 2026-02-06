"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useState, useEffect } from 'react';

export default function ResultsPage() {
  const { theme, colors } = useTheme();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const stats = [
    { value: '127M+', label: 'Total Views' },
    { value: '2,400+', label: 'Creators' },
    { value: '89%', label: 'Viral Rate' },
    { value: '45', label: 'Countries' },
  ];

  const testimonials = [
    {
      quote: "Apollova completely transformed my content. I went from 1K to 100K followers in 3 months.",
      author: "Creator Name",
      role: "TikTok Creator",
      stats: "1.2M views on first video",
    },
    {
      quote: "The quality is unmatched. My engagement rate tripled after switching to these templates.",
      author: "Creator Name",
      role: "Music Producer",
      stats: "500K+ total views",
    },
    {
      quote: "Professional results without the learning curve. Worth every penny.",
      author: "Creator Name",
      role: "Content Creator",
      stats: "50+ videos created",
    },
  ];

  const caseStudies = [
    { before: "2K followers", after: "150K followers", timeframe: "4 months", platform: "TikTok" },
    { before: "500 avg views", after: "50K avg views", timeframe: "2 months", platform: "Instagram" },
    { before: "0 viral videos", after: "12 viral videos", timeframe: "6 months", platform: "YouTube" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <>
      <PublicNavbar />
      <main style={{
        minHeight: '100vh',
        background: colors.background,
        transition: 'all 0.3s ease',
      }}>
        {/* Hero */}
        <section style={{
          padding: 'clamp(120px, 15vw, 160px) 20px clamp(60px, 10vw, 100px)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(36px, 8vw, 64px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '20px',
            letterSpacing: '-2px',
          }}>
            Real Results
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.8',
            padding: '0 20px',
          }}>
            See how creators around the world are building audiences and creating viral content.
          </p>
        </section>

        {/* Stats */}
        <section style={{
          padding: 'clamp(40px, 6vw, 60px) 20px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '24px' : '40px',
            maxWidth: '1000px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            {stats.map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontSize: isMobile ? '28px' : 'clamp(32px, 5vw, 48px)',
                  fontWeight: '300',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '6px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: isMobile ? '11px' : '13px',
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

        {/* Before/After */}
        <section style={{
          padding: 'clamp(60px, 10vw, 120px) 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            Transformations
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: 'clamp(13px, 2vw, 16px)',
            textAlign: 'center',
            marginBottom: 'clamp(32px, 6vw, 60px)',
          }}>
            Before and after using Apollova
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'clamp(16px, 3vw, 32px)',
          }}>
            {caseStudies.map((study, index) => (
              <div 
                key={index}
                style={{
                  background: colors.backgroundSecondary,
                  padding: 'clamp(20px, 4vw, 32px)',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  color: colors.textSecondary,
                  fontSize: '12px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  Before
                </div>
                <div style={{
                  fontSize: 'clamp(18px, 3vw, 24px)',
                  color: colors.text,
                  marginBottom: '20px',
                  fontWeight: '300',
                }}>
                  {study.before}
                </div>

                <div style={{
                  fontSize: '20px',
                  color: colors.accent,
                  marginBottom: '20px',
                }}>
                  ↓
                </div>

                <div style={{
                  color: colors.textSecondary,
                  fontSize: '12px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  After
                </div>
                <div style={{
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  fontWeight: '400',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '20px',
                }}>
                  {study.after}
                </div>

                <div style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                }}>
                  {study.timeframe} • {study.platform}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
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
              marginBottom: 'clamp(32px, 6vw, 60px)',
            }}>
              What Creators Say
            </h2>

            <div style={{ minHeight: isMobile ? '200px' : '180px' }}>
              <blockquote style={{
                fontSize: 'clamp(18px, 3.5vw, 28px)',
                fontWeight: '300',
                color: colors.text,
                lineHeight: '1.6',
                marginBottom: '24px',
                fontStyle: 'italic',
                padding: '0 10px',
              }}>
                "{testimonials[activeTestimonial].quote}"
              </blockquote>

              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: colors.text, fontWeight: '500' }}>
                  {testimonials[activeTestimonial].author}
                </span>
                <span style={{ color: colors.textSecondary }}> — </span>
                <span style={{ color: colors.textSecondary }}>
                  {testimonials[activeTestimonial].role}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: colors.accent }}>
                {testimonials[activeTestimonial].stats}
              </div>
            </div>

            {/* Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '32px',
            }}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  style={{
                    width: index === activeTestimonial ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: index === activeTestimonial ? colors.accent : colors.border,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Showcase Grid */}
        <section style={{
          padding: 'clamp(60px, 10vw, 120px) 20px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 40px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            Creator Showcase
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: 'clamp(13px, 2vw, 16px)',
            textAlign: 'center',
            marginBottom: 'clamp(32px, 6vw, 60px)',
          }}>
            Featured content made with Apollova
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '140px' : '200px'}, 1fr))`,
            gap: isMobile ? '8px' : '16px',
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                style={{
                  aspectRatio: '9/16',
                  background: colors.backgroundSecondary,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`/images/showcase-${item}.jpg`}
                  alt={`Showcase ${item}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{
          padding: 'clamp(80px, 12vw, 120px) 20px',
          background: theme === 'light' 
            ? colors.text 
            : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(24px, 5vw, 44px)',
            fontWeight: '300',
            color: '#fff',
            marginBottom: '20px',
          }}>
            Ready to join them?
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 'clamp(14px, 2vw, 16px)',
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
            lineHeight: '1.8',
            padding: '0 20px',
          }}>
            Start creating viral content with professional templates.
          </p>
          <a
            href="mailto:contact@apollova.co.uk?subject=Interested in Apollova"
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
            Get Started
          </a>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
