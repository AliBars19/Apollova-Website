"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 1000,
        background: 'rgba(5, 5, 9, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(102, 126, 234, 0.3)',
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>
            Apollova
          </Link>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(102, 126, 234, 0.2)',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            color: '#667eea',
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
                    color: isActive(link.href) ? '#fff' : '#aaa',
                    background: isActive(link.href) ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive(link.href) ? '600' : '400',
                    transition: 'all 0.2s ease',
                    border: isActive(link.href) ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: Back + Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                href="/"
                style={{
                  padding: '8px 16px',
                  color: '#888',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                ← Site
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '14px',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  opacity: loggingOut ? 0.5 : 1,
                }}
              >
                {loggingOut ? '...' : 'Logout'}
              </button>
            </div>
          </>
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
          >
            <span style={{
              width: '24px',
              height: '2px',
              background: '#fff',
              transition: 'all 0.3s ease',
              transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }} />
            <span style={{
              width: '24px',
              height: '2px',
              background: '#fff',
              opacity: mobileMenuOpen ? 0 : 1,
              transition: 'all 0.3s ease',
            }} />
            <span style={{
              width: '24px',
              height: '2px',
              background: '#fff',
              transition: 'all 0.3s ease',
              transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }} />
          </button>
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
          background: '#050509',
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
                  color: isActive(link.href) ? '#fff' : '#aaa',
                  background: isActive(link.href) ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive(link.href) ? '600' : '400',
                  border: isActive(link.href) ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid transparent',
                }}
              >
                {link.label}
              </Link>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

            <Link
              href="/"
              style={{
                padding: '16px',
                color: '#888',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              ← Back to Site
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '16px',
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                opacity: loggingOut ? 0.5 : 1,
                marginTop: '8px',
              }}
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
