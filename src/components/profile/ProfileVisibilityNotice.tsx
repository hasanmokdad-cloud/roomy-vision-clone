import { Link } from 'react-router-dom';

export function ProfileVisibilityNotice() {
  return (
    <p className="text-xs text-muted-foreground leading-relaxed">
      Certain profile info, like your name, age, gender, location, university, major, year of study, budget, and room type, is visible to matched roommates.{' '}
      <Link 
        to="/help/profile-visibility" 
        className="text-primary hover:underline"
      >
        See what profile info is visible
      </Link>
    </p>
  );
}
