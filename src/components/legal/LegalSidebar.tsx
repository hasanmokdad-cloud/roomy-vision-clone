import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { legalDocuments, formatLastUpdated } from '@/data/legalDocuments';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Scale } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LegalSidebarProps {
  className?: string;
}

function SidebarContent({ currentPage }: { currentPage: string | undefined }) {
  return (
    <div className="space-y-1">
      {/* Hub Link */}
      <Link
        to="/legal"
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
          !currentPage
            ? "bg-primary/10 text-primary border border-primary/20"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          !currentPage ? "bg-primary/20" : "bg-muted"
        )}>
          <Scale className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Legal Hub</p>
          <p className="text-xs text-muted-foreground truncate">Overview</p>
        </div>
      </Link>

      <div className="h-px bg-border my-3" />

      {/* Document Links */}
      {legalDocuments.map((doc) => (
        <Link
          key={doc.id}
          to={`/legal/${doc.id}`}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
            currentPage === doc.id
              ? "bg-primary/10 text-primary border border-primary/20"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            currentPage === doc.id ? "bg-primary/20" : "bg-muted"
          )}>
            {doc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{doc.shortTitle}</p>
            <p className="text-xs text-muted-foreground truncate">
              Updated {formatLastUpdated(doc.lastUpdated)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function LegalSidebar({ className }: LegalSidebarProps) {
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
    <aside className={cn("w-72 shrink-0", className)}>
      <div className="sticky top-24 bg-card border border-border rounded-xl p-4">
        <h2 className="font-bold text-lg mb-4 px-3">Legal Documents</h2>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <SidebarContent currentPage={page} />
        </ScrollArea>
      </div>
    </aside>
  );
}
