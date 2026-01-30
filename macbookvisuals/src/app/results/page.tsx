"use client";

import { useTheme } from '@/context/ThemeContext';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useState, useEffect } from 'react';

export default function ResultsPage() {
  const { theme, colors } = useTheme();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Stats ticker data
  const stats = [
    { value: '127M+', label: 'Total Views' },
    { value: '2,400+', label: 'Creators' },
    { value: '89%', label: 'Viral Rate' },
    { value: '45', label: 'Countries' },
  ];

  // Testimonials - EDIT THESE
  const testimonials = [
    {
      quote: "MacBook Visuals completely transformed my content. I went from 1K to 100K followers in 3 months.",
      author: "Creator Name",
      role: "TikTok Creator",
      image: "/images/testimonial-1.jpg",
      stats: "1.2M views on first video",
    },
    {
      quote: "The quality is unmatched. My engagement rate tripled after switching to these templates.",
      author: "Creator Name",
      role: "Music Producer",
      image: "/images/testimonial-2.jpg",
      stats: "500K+ total views",
    },
    {
      quote: "Professional results without the learning curve. Worth every penny.",
      author: "Creator Name",
      role: "Content Creator",
      image: "/images/testimonial-3.jpg",
      stats: "50+ videos created",
    },
  ];

  // Example results/case studies - EDIT THESE
  const caseStudies = [
    {
      before: "2K followers",
      after: "150K followers",
      timeframe: "4 months",
      platform: "TikTok",
      image: "/images/case-study-1.jpg",
    },
    {
      before: "500 avg views",
      after: "50K avg views",
      timeframe: "2 months",
      platform: "Instagram",
      image: "/images/case-study-2.jpg",
    },
    {
      before: "0 viral videos",
      after: "12 viral videos",
      timeframe: "6 months",
      platform: "YouTube Shorts",
      image: "/images/case-study-3.jpg",
    },
  ];

  // Auto-rotate testimonials
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
          padding: '160px 40px 100px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '24px',
            letterSpacing: '-2px',
          }}>
            Real Results
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.8',
          }}>
            See how creators around the world are using MacBook Visuals to build audiences 
            and create viral content.
          </p>
        </section>

        {/* Stats Ticker */}
        <section style={{
          padding: '60px 0',
          background: colors.backgroundSecondary,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '80px',
            flexWrap: 'wrap',
            padding: '0 40px',
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: '300',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Before/After Case Studies */}
        <section style={{
          padding: '120px 40px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            Transformations
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '60px',
          }}>
            Before and after using MacBook Visuals templates
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
          }}>
            {caseStudies.map((study, index) => (
              <div 
                key={index}
                style={{
                  background: colors.backgroundSecondary,
                  padding: '32px',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Before */}
                <div style={{
                  color: colors.textSecondary,
                  fontSize: '14px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  Before
                </div>
                <div style={{
                  fontSize: '24px',
                  color: colors.text,
                  marginBottom: '24px',
                  fontWeight: '300',
                }}>
                  {study.before}
                </div>

                {/* Arrow */}
                <div style={{
                  fontSize: '24px',
                  color: colors.accent,
                  marginBottom: '24px',
                }}>
                  ↓
                </div>

                {/* After */}
                <div style={{
                  color: colors.textSecondary,
                  fontSize: '14px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  After
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '400',
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '24px',
                }}>
                  {study.after}
                </div>

                {/* Meta */}
                <div style={{
                  fontSize: '13px',
                  color: colors.textSecondary,
                }}>
                  {study.timeframe} • {study.platform}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Carousel */}
        <section style={{
          padding: '100px 40px',
          background: colors.backgroundSecondary,
        }}>
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: '300',
              color: colors.text,
              marginBottom: '60px',
            }}>
              What Creators Say
            </h2>

            {/* Active Testimonial */}
            <div style={{
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <blockquote style={{
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: '300',
                color: colors.text,
                lineHeight: '1.6',
                marginBottom: '32px',
                fontStyle: 'italic',
              }}>
                "{testimonials[activeTestimonial].quote}"
              </blockquote>

              <div style={{
                marginBottom: '8px',
              }}>
                <span style={{ color: colors.text, fontWeight: '500' }}>
                  {testimonials[activeTestimonial].author}
                </span>
                <span style={{ color: colors.textSecondary }}> — </span>
                <span style={{ color: colors.textSecondary }}>
                  {testimonials[activeTestimonial].role}
                </span>
              </div>

              <div style={{
                fontSize: '14px',
                color: colors.accent,
              }}>
                {testimonials[activeTestimonial].stats}
              </div>
            </div>

            {/* Dots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '40px',
            }}>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  style={{
                    width: index === activeTestimonial ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: index === activeTestimonial 
                      ? colors.accent 
                      : colors.border,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Video Showcase Grid */}
        <section style={{
          padding: '120px 40px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '300',
            color: colors.text,
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            Creator Showcase
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: '16px',
            textAlign: 'center',
            marginBottom: '60px',
          }}>
            Featured content made with MacBook Visuals
          </p>

          {/* Placeholder Grid - Add actual video embeds or images */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
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
                {/* Replace with actual video thumbnails or embeds */}
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

        {/* CTA Section */}
        <section style={{
          padding: '120px 40px',
          background: theme === 'light' 
            ? colors.text 
            : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: '300',
            color: '#fff',
            marginBottom: '24px',
          }}>
            Ready to join them?
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '16px',
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px',
            lineHeight: '1.8',
          }}>
            Start creating viral content with professional templates trusted by thousands of creators.
          </p>
          <a
            href="mailto:contact@macbookvisuals.com?subject=Interested in MacBook Visuals"
            style={{
              display: 'inline-block',
              padding: '18px 48px',
              background: '#fff',
              color: '#1a1a1a',
              textDecoration: 'none',
              fontSize: '15px',
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
