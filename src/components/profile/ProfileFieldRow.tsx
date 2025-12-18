import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface ProfileFieldRowProps {
  icon?: ReactNode;
  label: string;
  value?: string | number | null;
  placeholder?: string;
  onClick: () => void;
  required?: boolean;
}

export const ProfileFieldRow = ({
  icon,
  label,
  value,
  placeholder = 'Not provided',
  onClick,
  required = false,
}: ProfileFieldRowProps) => {
  const displayValue = value !== null && value !== undefined && value !== '' 
    ? String(value) 
    : placeholder;
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 px-0 border-b border-border hover:bg-muted/30 transition-colors text-left"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className="text-muted-foreground shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </div>
          <div className={`text-base truncate ${hasValue ? 'text-foreground' : 'text-muted-foreground/60'}`}>
            {displayValue}
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
};
