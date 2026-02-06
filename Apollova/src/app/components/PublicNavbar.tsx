"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function PublicNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, colors } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const templates = [
    { href: '/templates/apollova-aurora', label: 'Apollova Aurora' },
    { href: '/templates/apollova-nova', label: 'Apollova Nova' },
    { href: '/templates/apollova-onyx', label: 'Apollova Onyx' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: theme === 'light' 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(5, 5, 9, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`,
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: Logo + Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.text,
              textDecoration: 'none',
              letterSpacing: '-0.5px',
            }}>
              Apollova
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                background: theme === 'light' ? '#e5e5e5' : '#333',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
              aria-label="Toggle theme"
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: theme === 'light' ? '#fff' : colors.accent,
                position: 'absolute',
                top: '2px',
                left: theme === 'light' ? '2px' : '18px',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
            }}>
              <Link
                href="/"
                style={{
                  color: isActive('/') && pathname === '/' ? colors.text : colors.textSecondary,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive('/') && pathname === '/' ? '500' : '400',
                  transition: 'color 0.2s ease',
                }}
              >
                Home
              </Link>

              {/* Templates Dropdown */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  style={{
                    color: isActive('/templates') ? colors.text : colors.textSecondary,
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: isActive('/templates') ? '500' : '400',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'color 0.2s ease',
                  }}
                >
                  Templates
                  <svg 
                    width="10" 
                    height="6" 
                    viewBox="0 0 10 6" 
                    fill="none"
                    style={{
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path 
                      d="M1 1L5 5L9 1" 
                      stroke={isActive('/templates') ? colors.text : colors.textSecondary} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  paddingTop: '12px',
                  opacity: dropdownOpen ? 1 : 0,
                  visibility: dropdownOpen ? 'visible' : 'hidden',
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '8px',
                    minWidth: '180px',
                    boxShadow: theme === 'light' 
                      ? '0 10px 40px rgba(0,0,0,0.1)' 
                      : '0 10px 40px rgba(0,0,0,0.5)',
                  }}>
                    {templates.map((template) => (
                      <Link
                        key={template.href}
                        href={template.href}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          color: isActive(template.href) ? colors.accent : colors.text,
                          textDecoration: 'none',
                          fontSize: '14px',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = colors.backgroundSecondary}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {template.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/results"
                style={{
                  color: isActive('/results') ? colors.text : colors.textSecondary,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive('/results') ? '500' : '400',
                  transition: 'color 0.2s ease',
                }}
              >
                Results
              </Link>
            </div>
          )}

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Desktop CTA */}
            {!isMobile && (
              <a
                href="mailto:contact@apollova.co.uk?subject=Inquiry about Apollova"
                style={{
                  padding: '10px 24px',
                  background: theme === 'light' ? colors.text : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                  color: theme === 'light' ? colors.background : '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                }}
              >
                Contact Us
              </a>
            )}

            {/* Mobile Hamburger */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}
                aria-label="Toggle menu"
              >
                <span style={{
                  width: '24px',
                  height: '2px',
                  background: colors.text,
                  transition: 'all 0.3s ease',
                  transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                }} />
                <span style={{
                  width: '24px',
                  height: '2px',
                  background: colors.text,
                  transition: 'all 0.3s ease',
                  opacity: mobileMenuOpen ? 0 : 1,
                }} />
                <span style={{
                  width: '24px',
                  height: '2px',
                  background: colors.text,
                  transition: 'all 0.3s ease',
                  transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                }} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          background: colors.background,
          zIndex: 999,
          padding: '24px',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              href="/"
              style={{
                color: isActive('/') && pathname === '/' ? colors.accent : colors.text,
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: '500',
                padding: '16px 0',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              Home
            </Link>

            {/* Templates Section */}
            <div style={{ borderBottom: `1px solid ${colors.border}` }}>
              <div style={{
                color: colors.textSecondary,
                fontSize: '14px',
                fontWeight: '500',
                padding: '16px 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Templates
              </div>
              {templates.map((template) => (
                <Link
                  key={template.href}
                  href={template.href}
                  style={{
                    display: 'block',
                    color: isActive(template.href) ? colors.accent : colors.text,
                    textDecoration: 'none',
                    fontSize: '16px',
                    padding: '12px 0 12px 16px',
                  }}
                >
                  {template.label}
                </Link>
              ))}
            </div>

            <Link
              href="/results"
              style={{
                color: isActive('/results') ? colors.accent : colors.text,
                textDecoration: 'none',
                fontSize: '18px',
                fontWeight: '500',
                padding: '16px 0',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              Results
            </Link>

            {/* Mobile CTA */}
            <a
              href="mailto:contact@apollova.com?subject=Inquiry about Apollova"
              style={{
                marginTop: '24px',
                padding: '16px 24px',
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentSecondary} 100%)`,
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      )}
    </>
  );
}
