"use client";

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function PublicFooter() {
  const { theme, colors } = useTheme();

  return (
    <footer style={{
      background: colors.backgroundSecondary,
      borderTop: `1px solid ${colors.border}`,
      padding: '60px 40px 40px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
          marginBottom: '48px',
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: colors.text,
              marginBottom: '16px',
            }}>
              MacBook Visuals
            </div>
            <p style={{
              color: colors.textSecondary,
              fontSize: '14px',
              lineHeight: '1.7',
            }}>
              Premium After Effects templates for creating viral music visualizations.
            </p>
          </div>

          {/* Templates */}
          <div>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: '16px', 
              fontSize: '14px', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Templates
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { href: '/templates/template-1', label: 'Template One' },
                { href: '/templates/template-2', label: 'Template Two' },
                { href: '/templates/template-3', label: 'Template Three' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    fontSize: '14px',
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
              marginBottom: '16px', 
              fontSize: '14px', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '14px' }}>
                Home
              </Link>
              <Link href="/results" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '14px' }}>
                Results
              </Link>
              <Link href="/terms-of-service" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '14px' }}>
                Terms of Service
              </Link>
              <Link href="/privacy-policy" style={{ color: colors.textSecondary, textDecoration: 'none', fontSize: '14px' }}>
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ 
              color: colors.text, 
              marginBottom: '16px', 
              fontSize: '14px', 
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Contact
            </h4>
            <a
              href="mailto:contact@macbookvisuals.com"
              style={{
                color: colors.accent,
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              contact@macbookvisuals.com
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <p style={{ color: colors.textSecondary, fontSize: '13px' }}>
            © {new Date().getFullYear()} MacBook Visuals. All rights reserved.
          </p>
          
          {/* Hidden Admin Link */}
          <Link
            href="/gate"
            style={{
              color: theme === 'light' ? '#ccc' : '#333',
              textDecoration: 'none',
              fontSize: '12px',
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
