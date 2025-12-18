import { ReactNode } from 'react';

interface ProfileSectionHeaderProps {
  icon: ReactNode;
  title: string;
  className?: string;
}

export const ProfileSectionHeader = ({
  icon,
  title,
  className = '',
}: ProfileSectionHeaderProps) => {
  return (
    <h3 className={`text-xl font-semibold text-foreground flex items-center gap-2 py-4 ${className}`}>
      <span className="text-primary">{icon}</span>
      {title}
    </h3>
  );
};
