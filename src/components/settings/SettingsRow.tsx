import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  badge?: string | number;
  className?: string;
}

export function SettingsRow({
  icon,
  label,
  subtitle,
  onClick,
  rightElement,
  showChevron = true,
  destructive = false,
  badge,
  className,
}: SettingsRowProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 py-4 px-1 transition-colors text-left group',
        onClick && 'hover:bg-muted/30 cursor-pointer -mx-1 px-2 rounded-lg',
        destructive && 'text-destructive',
        className
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          destructive ? 'bg-destructive/10' : 'bg-muted/50'
        )}
      >
        <span className={cn(destructive ? 'text-destructive' : 'text-muted-foreground')}>
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', destructive ? 'text-destructive' : 'text-foreground')}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {badge !== undefined && (
        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      {rightElement}

      {showChevron && onClick && !rightElement && (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
      )}
    </Component>
  );
}
