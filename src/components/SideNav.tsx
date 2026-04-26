'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/overview', label: 'Overview', icon: 'dashboard' },
  { href: '/analysis', label: 'Analysis', icon: 'analytics' },
  { href: '/ai-assistant', label: 'AI Assistant', icon: 'smart_toy' },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex-shrink-0 flex flex-col py-6 px-2 bg-background z-50"
      style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}>

      {/* Brand */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary"
          style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            sports_soccer
          </span>
        </div>
        <div>
          <h1 className="text-xl font-black text-primary tracking-tight">Offside</h1>
          <p className="text-xs text-on-surface-variant font-medium">AI Coaching Dashboard</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 text-sm font-medium">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? 'text-primary font-semibold rounded-xl m-2 px-4 py-3 flex items-center gap-3 transition-all duration-200'
                  : 'text-on-surface-variant m-2 px-4 py-3 flex items-center gap-3 rounded-xl transition-all duration-200 hover:text-primary'
              }
              style={
                active
                  ? { boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)' }
                  : undefined
              }
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
