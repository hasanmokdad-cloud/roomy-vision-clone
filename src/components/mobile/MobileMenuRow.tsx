import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  className?: string;
}

export function MobileMenuRow({
  icon,
  label,
  subtitle,
  onClick,
  showChevron = true,
  rightElement,
  destructive = false,
  className,
}: MobileMenuRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between py-4 px-0 active:bg-muted/30 transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-6 h-6 flex items-center justify-center",
          destructive ? "text-destructive" : "text-muted-foreground"
        )}>
          {icon}
        </div>
        <div className="text-left">
          <span className={cn(
            "text-base",
            destructive ? "text-destructive" : "text-foreground"
          )}>
            {label}
          </span>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {rightElement ? (
        rightElement
      ) : showChevron ? (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      ) : null}
    </button>
  );
}
