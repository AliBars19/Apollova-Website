"use client";

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
    }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 72px)',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 'bold'
        }}>
          MacBook Visuals
        </h1>
        
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          color: '#fff',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          Professional After Effects Template
        </h2>

        <p style={{
          color: '#aaa',
          marginBottom: '48px',
          fontSize: '18px',
          maxWidth: '600px',
          lineHeight: '1.8'
        }}>
          Create stunning music visualizations in minutes. The same template used 
          by top creators to generate millions of views.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => {
              window.location.href = 'mailto:contact@macbookvisuals.com?subject=Purchase MacBook Visuals Template';
            }}
            style={{
              padding: '18px 48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
            }}
          >
            💳 Purchase Template
          </button>

          <button
            onClick={() => router.push('/preview')}
            style={{
              padding: '18px 48px',
              background: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            👁️ View Preview
          </button>
        </div>

        <p style={{
          color: '#666',
          fontSize: '14px',
          marginTop: '16px'
        }}>
          One-time payment • Lifetime updates • Instant delivery
        </p>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '80px 20px',
        background: 'rgba(10, 10, 20, 0.5)',
        borderTop: '1px solid #222',
        borderBottom: '1px solid #222'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h3 style={{
            fontSize: '36px',
            textAlign: 'center',
            marginBottom: '64px',
            color: '#fff'
          }}>
            Everything You Need
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {[
              {
                icon: '⚡',
                title: 'Fast Setup',
                desc: 'Drop your audio file and render. No complex setup required.'
              },
              {
                icon: '🎨',
                title: 'Fully Customizable',
                desc: 'Change colors, fonts, animations to match your brand.'
              },
              {
                icon: '📱',
                title: 'Social Media Ready',
                desc: 'Optimized for TikTok, Instagram, YouTube Shorts.'
              },
              {
                icon: '🚀',
                title: 'High Performance',
                desc: 'Efficient rendering. Export 4K videos in minutes.'
              },
              {
                icon: '💎',
                title: 'Premium Quality',
                desc: 'Professional-grade animations and effects.'
              },
              {
                icon: '🔄',
                title: 'Lifetime Updates',
                desc: 'Get all future updates and improvements for free.'
              }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: '32px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                <h4 style={{ fontSize: '20px', marginBottom: '12px', color: '#fff' }}>
                  {feature.title}
                </h4>
                <p style={{ color: '#aaa', lineHeight: '1.6', fontSize: '15px' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '48px'
          }}>
            {[
              { number: '10M+', label: 'Total Views Generated' },
              { number: '500+', label: 'Happy Customers' },
              { number: '4.9/5', label: 'Average Rating' },
              { number: '24/7', label: 'Email Support' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: '#aaa', fontSize: '16px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 20px',
        background: 'rgba(10, 10, 20, 0.5)',
        borderTop: '1px solid #222',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '42px',
          marginBottom: '24px',
          color: '#fff'
        }}>
          Ready to Create?
        </h3>
        <p style={{
          color: '#aaa',
          marginBottom: '40px',
          fontSize: '18px',
          maxWidth: '600px',
          margin: '0 auto 40px'
        }}>
          Join hundreds of creators using MacBook Visuals to grow their audience.
        </p>
        <button
          onClick={() => {
            window.location.href = 'mailto:contact@macbookvisuals.com?subject=Purchase MacBook Visuals Template';
          }}
          style={{
            padding: '18px 48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
          }}
        >
          Get Started Now
        </button>
      </section>
    </main>
  );
}