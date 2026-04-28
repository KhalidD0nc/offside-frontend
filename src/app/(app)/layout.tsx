import AppShell from '@/components/AppShell';
import { ActiveJobsProvider } from '@/contexts/ActiveJobsContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveJobsProvider>
      <AppShell>{children}</AppShell>
    </ActiveJobsProvider>
  );
}
