import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface OwnerBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function OwnerBreadcrumb({ items }: OwnerBreadcrumbProps) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/owner" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <span key={index} className="contents">
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-foreground font-medium">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      <div className="h-4 w-3 bg-muted rounded animate-pulse" />
      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
    </div>
  );
}
