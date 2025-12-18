// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About"},
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-left">
        <span className="nav-logo">MacbookVisuals</span>
      </div>
      <div className="nav-links">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive ? "nav-link active" : "nav-link"}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
