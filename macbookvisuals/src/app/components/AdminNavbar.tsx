"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(5, 5, 9, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(102, 126, 234, 0.3)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{
            fontSize: '20px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>
            MacBook Visuals
          </Link>
          <span style={{
            padding: '4px 10px',
            background: 'rgba(102, 126, 234, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#667eea',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Admin
          </span>
        </div>

        {/* Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
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

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

          {/* Back to Site */}
          <Link
            href="/"
            style={{
              padding: '8px 16px',
              color: '#888',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease',
            }}
          >
            ← Back to Site
          </Link>

          {/* Logout */}
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
              transition: 'all 0.2s ease',
            }}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </nav>
  );
}
