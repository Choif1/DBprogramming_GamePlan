import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, isLoggedIn }) => {
  const location = useLocation();

  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

export default ProtectedRoute;

