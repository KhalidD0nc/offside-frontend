'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/overview', label: 'Overview', icon: 'dashboard' },
  { href: '/analysis', label: 'Analysis', icon: 'analytics' },
  { href: '/ai-assistant', label: 'AI Assistant', icon: 'smart_toy' },
];

const raisedShadow = '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.6)';
const insetShadow = 'inset 4px 4px 8px rgba(0,0,0,0.06), inset -4px -4px 8px rgba(255,255,255,0.5)';

export default function SideNav({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-shrink-0 flex-col bg-background px-2 py-6 transition-[width] duration-300 ${
        collapsed ? 'w-24' : 'w-64'
      }`}
      style={{ boxShadow: raisedShadow }}
    >

      {/* Brand */}
      <div className={`mb-8 flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary"
          style={{ boxShadow: raisedShadow }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            sports_soccer
          </span>
        </div>
        <div className={collapsed ? 'sr-only' : undefined}>
          <h1 className="text-xl font-black text-primary tracking-tight">Offside</h1>
          <p className="text-xs text-on-surface-variant font-medium">AI Coaching Dashboard</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary transition-transform active:scale-95 ${
          collapsed ? 'mx-auto' : 'ml-auto mr-4'
        }`}
        style={{ boxShadow: collapsed ? raisedShadow : insetShadow }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="material-symbols-outlined">
          {collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
        </span>
      </button>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 text-sm font-medium">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={
                active
                  ? `text-primary font-semibold rounded-xl m-2 py-3 flex items-center transition-all duration-200 ${
                      collapsed ? 'justify-center px-0' : 'gap-3 px-4'
                    }`
                  : `text-on-surface-variant m-2 py-3 flex items-center rounded-xl transition-all duration-200 hover:text-primary ${
                      collapsed ? 'justify-center px-0' : 'gap-3 px-4'
                    }`
              }
              style={
                active
                  ? { boxShadow: insetShadow }
                  : undefined
              }
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
