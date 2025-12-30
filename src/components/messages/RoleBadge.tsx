import { Shield, Building, GraduationCap, BadgeCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: 'Student' | 'Owner' | 'Admin' | string;
  dormName?: string | null;
  className?: string;
  isVerified?: boolean;
  iconOnly?: boolean;
}

export function RoleBadge({ role, dormName, className, isVerified, iconOnly }: RoleBadgeProps) {
  const getRoleConfig = () => {
    switch (role) {
      case 'Admin':
        return {
          icon: Shield,
          label: 'Admin',
          colorClass: 'text-orange-500'
        };
      case 'Owner':
        return {
          icon: Building,
          label: dormName ? `${dormName} • Owner` : 'Owner',
          colorClass: 'text-blue-500'
        };
      case 'Student':
      default:
        return {
          icon: GraduationCap,
          label: 'Student',
          colorClass: 'text-green-500'
        };
    }
  };

  const { icon: Icon, label, colorClass } = getRoleConfig();

  // Icon-only mode for compact displays (like sidebar)
  if (iconOnly) {
    return (
      <span className={`flex items-center gap-0.5 ${className || ''}`}>
        <Icon className={`w-3 h-3 ${colorClass}`} />
        {isVerified && <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-100" />}
      </span>
    );
  }

  return (
    <span className={`text-xs text-muted-foreground flex items-center gap-1 ${className || ''}`}>
      <Icon className={`w-3 h-3 ${colorClass}`} />
      <span className="truncate">{label}</span>
      {isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />}
    </span>
  );
}
