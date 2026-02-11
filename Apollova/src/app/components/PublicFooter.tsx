"use client";

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function PublicFooter() {
  const { theme, colors } = useTheme();

  return (
    <footer style={{
      background: colors.backgroundSecondary,
      borderTop: `1px solid ${colors.border}`,
      padding: '48px 20px 32px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '32px',
          marginBottom: '40px',
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.text,
              marginBottom: '12px',
            }}>
              Apollova
            </div>
            <p style={{
              color: colors.textSecondary,
              fontSize: '13px',
              lineHeight: '1.6',
            }}>
              Premium After Effects templates for viral music visualizations.
            </p>
          </div>

          {/* Templates */}
          <div>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: '12px', 
              fontSize: '12px', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Templates
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { href: '/templates/apollova-aurora', label: 'Apollova Aurora' },
                { href: '/templates/apollova-mono', label: 'Apollova Mono' },
                { href: '/templates/apollova-onyx', label: 'Apollova Onyx' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: '12px', 
              fontSize: '12px', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '13px' }}>
                Home
              </Link>
              <Link href="/results" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '13px' }}>
                Results
              </Link>
              <Link href="/terms-of-service" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '13px' }}>
                Terms
              </Link>
              <Link href="/privacy-policy" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '13px' }}>
                Privacy
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: '12px', 
              fontSize: '12px', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Contact
            </h4>
            <a
              href="mailto:contact@apollova.co.uk"
              style={{
                color: colors.accent,
                textDecoration: 'none',
                fontSize: '13px',
                wordBreak: 'break-all',
              }}
            >
              contact@apollova.co.uk
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{ color: colors.textSecondary, fontSize: '12px' }}>
            © {new Date().getFullYear()} Apollova
          </p>
          
          {/* Hidden Admin Link */}
          <Link
            href="/gate"
            style={{
              color: theme === 'light' ? '#ddd' : '#333',
              textDecoration: 'none',
              fontSize: '11px',
              transition: 'color 0.2s ease',
            }}
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
