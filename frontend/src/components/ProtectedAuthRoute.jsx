import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedAuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;

  return user ? <Outlet /> : <Navigate to='/' replace/>;
}

export default ProtectedAuthRoute;
