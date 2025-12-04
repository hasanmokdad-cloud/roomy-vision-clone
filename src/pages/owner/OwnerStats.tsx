import Navbar from '@/components/shared/Navbar';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function OwnerStats() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background w-full">
        <Navbar />
        <div className="flex-1 flex pt-20">
          <OwnerSidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Statistics</h1>
                <p className="text-foreground/60 mt-2">View your performance metrics</p>
              </div>

              <div className="glass-hover rounded-2xl p-6">
                <p className="text-foreground/60">Statistics dashboard coming soon...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
