'use client';

import { useSyncExternalStore } from 'react';
import SideNav from '@/components/SideNav';
import { useActiveJobs } from '@/contexts/ActiveJobsContext';

const NAV_STORAGE_KEY = 'offside-side-nav-collapsed';
const NAV_CHANGE_EVENT = 'offside-side-nav-change';

function subscribeToCollapsedState(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === NAV_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(NAV_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(NAV_CHANGE_EVENT, onChange);
  };
}

function loadCollapsedState() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(NAV_STORAGE_KEY) === 'true';
}

function getServerCollapsedState() {
  return false;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navCollapsed = useSyncExternalStore(
    subscribeToCollapsedState,
    loadCollapsedState,
    getServerCollapsedState,
  );
  const { jobs } = useActiveJobs();

  function toggleNav() {
    window.localStorage.setItem(NAV_STORAGE_KEY, String(!loadCollapsedState()));
    window.dispatchEvent(new Event(NAV_CHANGE_EVENT));
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <SideNav
        collapsed={navCollapsed}
        onToggle={toggleNav}
        activeJobCount={jobs.length}
      />
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
