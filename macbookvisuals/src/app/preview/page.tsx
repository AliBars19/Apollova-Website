"use client";

import { useRouter } from 'next/navigation';

export default function PreviewPage() {
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
            Template Preview
          </h1>
          <p style={{
            color: '#aaa',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            See the MacBook Visuals template in action. Watch examples and explore customization options.
          </p>
        </div>

        {/* Video Preview */}
        <div style={{
          marginBottom: '64px',
          background: 'rgba(10, 10, 20, 0.5)',
          border: '1px solid #333',
          borderRadius: '24px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            aspectRatio: '9/16',
            background: '#000',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #667eea',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Placeholder for video */}
            <div style={{
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎬</div>
              <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '16px' }}>
                Video preview coming soon
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Upload your sample video or embed YouTube link here
              </p>
            </div>
          </div>
          
          <p style={{
            marginTop: '24px',
            color: '#aaa',
            fontSize: '14px'
          }}>
            Example: The Weeknd - Blinding Lights • 1080x1920 • 60fps
          </p>
        </div>

        {/* Customization Options */}
        <div style={{
          marginBottom: '64px'
        }}>
          <h2 style={{
            fontSize: '32px',
            marginBottom: '32px',
            textAlign: 'center',
            color: '#fff'
          }}>
            Customization Options
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                title: '🎨 Colors',
                items: ['Background gradient', 'Text colors', 'Waveform color', 'Progress bar']
              },
              {
                title: '📝 Typography',
                items: ['Font family', 'Font size', 'Text position', 'Animation style']
              },
              {
                title: '🎵 Audio',
                items: ['Waveform style', 'Frequency bars', 'Audio reactivity', 'Visualizer type']
              },
              {
                title: '⚙️ Layout',
                items: ['Logo placement', 'Text alignment', 'Element spacing', 'Border style']
              }
            ].map((section, i) => (
              <div key={i} style={{
                padding: '32px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  marginBottom: '16px',
                  color: '#fff'
                }}>
                  {section.title}
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{
                      color: '#aaa',
                      marginBottom: '8px',
                      paddingLeft: '20px',
                      position: 'relative',
                      fontSize: '15px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: '#667eea'
                      }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specs */}
        <div style={{
          background: 'rgba(10, 10, 20, 0.5)',
          border: '1px solid #333',
          borderRadius: '24px',
          padding: '48px',
          marginBottom: '64px'
        }}>
          <h2 style={{
            fontSize: '32px',
            marginBottom: '32px',
            textAlign: 'center',
            color: '#fff'
          }}>
            Technical Specifications
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px'
          }}>
            {[
              { label: 'Resolution', value: '1080x1920 (9:16)' },
              { label: 'Frame Rate', value: '30/60 FPS' },
              { label: 'Duration', value: 'Any length' },
              { label: 'File Format', value: '.aep (After Effects)' },
              { label: 'AE Version', value: 'CC 2020 or later' },
              { label: 'Plugins Required', value: 'None' },
              { label: 'File Size', value: '~50 MB' },
              { label: 'Render Time', value: '2-5 minutes' }
            ].map((spec, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#aaa' }}>{spec.label}:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
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
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              marginRight: '16px'
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
            Purchase Now
          </button>

          <button
            onClick={() => router.push('/results')}
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
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            View Results
          </button>
        </div>
      </div>
    </main>
  );
}