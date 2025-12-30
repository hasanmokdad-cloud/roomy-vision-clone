import { Link } from 'react-router-dom';

export function ProfileVisibilityNotice() {
  return (
    <p className="text-xs text-muted-foreground leading-relaxed">
      Some information may become visible to matched roommates.{' '}
      <Link 
        to="/help/privacy-profile-visibility" 
        className="text-primary hover:underline"
      >
        Learn more
      </Link>
    </p>
  );
}
