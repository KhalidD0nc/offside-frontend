'use client';

import { useEffect, useState } from 'react';
import SideNav from '@/components/SideNav';

const NAV_STORAGE_KEY = 'offside-side-nav-collapsed';

function loadCollapsedState() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(NAV_STORAGE_KEY) === 'true';
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navCollapsed, setNavCollapsed] = useState(loadCollapsedState);

  useEffect(() => {
    window.localStorage.setItem(NAV_STORAGE_KEY, String(navCollapsed));
  }, [navCollapsed]);

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <SideNav collapsed={navCollapsed} onToggle={() => setNavCollapsed((value) => !value)} />
      <main
        className={`min-h-screen flex-1 overflow-y-auto bg-background p-5 transition-[margin] duration-300 lg:p-8 ${
          navCollapsed ? 'ml-24' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
