"use client";

import { useRouter } from 'next/navigation';

export default function ResultsPage() {
  const router = useRouter();

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
      padding: '100px 20px 80px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 56px)',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            Real Results
          </h1>
          <p style={{
            color: '#aaa',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            See what creators are achieving with MacBook Visuals template.
          </p>
        </div>

        {/* Success Stories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '32px',
          marginBottom: '80px'
        }}>
          {[
            {
              creator: '@musicvibes',
              platform: 'TikTok',
              views: '2.5M',
              growth: '+15K followers',
              quote: 'This template completely changed my content game. I went from 200 to 15K followers in 3 months.'
            },
            {
              creator: '@beatsandvibes',
              platform: 'Instagram',
              views: '1.8M',
              growth: '+10K followers',
              quote: 'Professional quality without the professional price tag. Best investment I\'ve made.'
            },
            {
              creator: '@soundwaveofficial',
              platform: 'YouTube',
              views: '3.2M',
              growth: '+25K subscribers',
              quote: 'My videos now look just as good as the big channels. The engagement skyrocketed.'
            }
          ].map((story, i) => (
            <div key={i} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '32px',
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '4px'
                  }}>
                    {story.creator}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#667eea'
                  }}>
                    {story.platform}
                  </div>
                </div>
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(102, 126, 234, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#667eea'
                }}>
                  {story.views} views
                </div>
              </div>

              <p style={{
                color: '#aaa',
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '20px',
                fontStyle: 'italic'
              }}>
                "{story.quote}"
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#4ade80',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span>📈</span>
                <span>{story.growth}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Example Videos Grid */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{
            fontSize: '36px',
            marginBottom: '40px',
            textAlign: 'center',
            color: '#fff'
          }}>
            Example Videos
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {[
              'The Weeknd - Blinding Lights',
              'Drake - God\'s Plan',
              'Post Malone - Circles',
              'Billie Eilish - Bad Guy',
              'Travis Scott - SICKO MODE',
              'Juice WRLD - Lucid Dreams'
            ].map((title, i) => (
              <div key={i} style={{
                aspectRatio: '9/16',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                border: '2px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              }}>
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
                  <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                    {title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center',
            marginTop: '32px',
            color: '#666',
            fontSize: '14px'
          }}>
            Click to play • Videos open in new window
          </p>
        </div>

        {/* Stats Banner */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '24px',
          padding: '48px 32px',
          textAlign: 'center',
          marginBottom: '80px'
        }}>
          <h3 style={{
            fontSize: '28px',
            marginBottom: '32px',
            color: '#fff'
          }}>
            Combined Creator Stats
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px'
          }}>
            {[
              { number: '10M+', label: 'Total Views' },
              { number: '500+', label: 'Creators' },
              { number: '50K+', label: 'New Followers' },
              { number: '95%', label: 'Satisfaction Rate' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  color: '#667eea',
                  marginBottom: '8px'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: '#aaa', fontSize: '16px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          padding: '64px 32px',
          background: 'rgba(10, 10, 20, 0.5)',
          borderRadius: '24px',
          border: '1px solid #333'
        }}>
          <h2 style={{
            fontSize: '36px',
            marginBottom: '16px',
            color: '#fff'
          }}>
            Ready to Grow Your Channel?
          </h2>
          <p style={{
            color: '#aaa',
            marginBottom: '32px',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Join hundreds of creators who are already using MacBook Visuals.
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
            Get Started Today
          </button>
        </div>
      </div>
    </main>
  );
}