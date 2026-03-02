import { Link, useParams } from 'react-router-dom';
import { legalDocuments } from '@/data/legalDocuments';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Scale } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const BLUE = '#1D4ED8';
const BLUE_BG = 'rgba(29,78,216,0.08)';

function SidebarContent({ currentPage }: { currentPage: string | undefined }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {/* Hub Link */}
      <Link
        to="/legal"
        style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
          textDecoration: 'none', transition: 'all 0.2s',
          backgroundColor: !currentPage ? BLUE_BG : 'transparent',
          borderLeft: !currentPage ? `3px solid ${BLUE}` : '3px solid transparent',
        }}
      >
        <Scale size={16} style={{ color: !currentPage ? BLUE : '#6B7280', flexShrink: 0 }} />
        <span style={{ fontSize: '14px', fontWeight: !currentPage ? 600 : 500, color: !currentPage ? BLUE : '#374151' }}>
          Legal Hub Overview
        </span>
      </Link>

      {/* Document Links */}
      {legalDocuments.map((doc) => {
        const isActive = currentPage === doc.id;
        return (
          <Link
            key={doc.id}
            to={`/legal/${doc.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
              textDecoration: 'none', transition: 'all 0.2s',
              backgroundColor: isActive ? BLUE_BG : 'transparent',
              borderLeft: isActive ? `3px solid ${BLUE}` : '3px solid transparent',
            }}
          >
            <span style={{ color: isActive ? BLUE : '#6B7280', flexShrink: 0 }}>{doc.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500, color: isActive ? BLUE : '#374151' }}>
              {doc.shortTitle}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function LegalSidebar() {
  const { page } = useParams();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed bottom-20 left-4 z-50 shadow-lg">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">Legal Documents</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)] p-4">
            <SidebarContent currentPage={page} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside style={{ width: '280px', flexShrink: 0 }}>
      <div style={{
        position: 'sticky', top: '96px',
        backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px',
        padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '0 12px' }}>
          <Scale size={18} style={{ color: BLUE }} />
          <h2 style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>Legal Documents</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <SidebarContent currentPage={page} />
        </ScrollArea>
      </div>
    </aside>
  );
}
