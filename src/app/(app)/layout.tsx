import SideNav from '@/components/SideNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-background text-on-surface min-h-screen">
      <SideNav />
      <main className="ml-64 flex-1 p-8 lg:p-12 overflow-y-auto min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
