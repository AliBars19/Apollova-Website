"use client";

import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer style={{
      background: 'rgba(5, 5, 9, 0.95)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '48px 24px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '48px',
          marginBottom: '48px',
        }}>
          {/* Brand */}
          <div style={{ maxWidth: '300px' }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px',
            }}>
              MacBook Visuals
            </div>
            <p style={{
              color: '#888',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              Professional After Effects template for creating viral music visualizations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About' },
                { href: '/preview', label: 'Preview' },
                { href: '/results', label: 'Results' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: '#888',
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

          {/* Legal */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
              Legal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/terms-of-service"
                style={{
                  color: '#888',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy-policy"
                style={{
                  color: '#888',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
              Contact
            </h4>
            <a
              href="mailto:contact@macbookvisuals.com"
              style={{
                color: '#667eea',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <p style={{ color: '#666', fontSize: '13px' }}>
            © {new Date().getFullYear()} MacBook Visuals. All rights reserved.
          </p>
          
          {/* Hidden Admin Link - subtle but accessible */}
          <Link
            href="/gate"
            style={{
              color: '#444',
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
