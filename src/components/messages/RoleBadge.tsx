import { Shield, Building, GraduationCap } from 'lucide-react';

interface RoleBadgeProps {
  role: 'Student' | 'Owner' | 'Admin' | string;
  dormName?: string | null;
  className?: string;
}

export function RoleBadge({ role, dormName, className }: RoleBadgeProps) {
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

  return (
    <span className={`text-xs text-muted-foreground flex items-center gap-1 ${className || ''}`}>
      <Icon className={`w-3 h-3 ${colorClass}`} />
      <span className="truncate">{label}</span>
    </span>
  );
}
