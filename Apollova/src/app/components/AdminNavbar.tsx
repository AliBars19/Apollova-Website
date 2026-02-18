"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function AdminNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, colors } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
    { href: '/licenses', label: 'Licenses' },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  // Lewis Hamilton 2020 purple
  const accentColor = '#2D004B';
  const accentColorMuted = 'rgba(45, 0, 75, 0.3)';

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 1000,
        background: theme === 'dark' 
          ? 'rgba(5, 5, 9, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${accentColorMuted}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        {/* Left: Logo + Admin Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/dashboard" style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: accentColor,
            textDecoration: 'none',
          }}>
            Apollova
          </Link>
          <span style={{
            padding: '3px 8px',
            background: `${accentColor}20`,
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Admin
          </span>
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <>
            {/* Center: Nav Links */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
            }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    color: isActive(link.href) ? colors.text : colors.textSecondary,
                    background: isActive(link.href) ? `${accentColor}20` : 'transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive(link.href) ? '600' : '400',
                    transition: 'all 0.2s ease',
                    border: isActive(link.href) ? `1px solid ${accentColorMuted}` : '1px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: Back + Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                href="/"
                style={{
                  padding: '8px 16px',
                  color: colors.textSecondary,
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                ← Site
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  padding: '8px 12px',
                  background: colors.backgroundSecondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </>
        )}

        {/* Mobile Hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: colors.text,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
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
                opacity: mobileMenuOpen ? 0 : 1,
                transition: 'all 0.3s ease',
              }} />
              <span style={{
                width: '24px',
                height: '2px',
                background: colors.text,
                transition: 'all 0.3s ease',
                transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
              }} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          background: colors.background,
          zIndex: 999,
          padding: '20px',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  color: isActive(link.href) ? colors.text : colors.textSecondary,
                  background: isActive(link.href) ? `${accentColor}20` : 'transparent',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive(link.href) ? '600' : '400',
                  border: isActive(link.href) ? `1px solid ${accentColorMuted}` : '1px solid transparent',
                }}
              >
                {link.label}
              </Link>
            ))}

            <div style={{ height: '1px', background: colors.border, margin: '16px 0' }} />

            <Link
              href="/"
              style={{
                padding: '16px',
                color: colors.textSecondary,
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
