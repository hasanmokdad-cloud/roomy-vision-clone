import { Navigate } from 'react-router-dom';

const Welcome = () => {
  // Redirect to animated intro instead
  return <Navigate to="/animated-intro" replace />;
};

export default Welcome;
