import { useState, useEffect } from 'react';
import { AdminNavbar } from './AdminNavbar';
import { AdminSidebarFixed } from './AdminSidebarFixed';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // Default to open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile when resizing down
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      // Auto-open sidebar on desktop when resizing up
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navbar */}
      <AdminNavbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      {/* Fixed Sidebar */}
      <AdminSidebarFixed 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={closeSidebar}
          style={{ top: '70px' }}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "pt-[70px] min-h-screen transition-all duration-300",
          // Desktop: shift content when sidebar open
          !isMobile && sidebarOpen && "ml-[240px]",
          // Mobile: no shift, sidebar overlays
          isMobile && "ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
