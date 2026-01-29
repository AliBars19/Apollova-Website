"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/preview', label: 'Preview' },
    { href: '/results', label: 'Results' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(5, 5, 9, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontSize: '20px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textDecoration: 'none',
        }}>
          MacBook Visuals
        </Link>

        {/* Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: isActive(link.href) ? '#667eea' : '#aaa',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive(link.href) ? '600' : '400',
                transition: 'color 0.2s ease',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* CTA Button */}
          <a
            href="mailto:contact@macbookvisuals.com?subject=Inquiry about MacBook Visuals Template"
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            Get In Touch
          </a>
        </div>
      </div>
    </nav>
  );
}
