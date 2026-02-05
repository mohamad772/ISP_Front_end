import { Navigate } from 'react-router-dom';
import { useStore } from '@/store/auth-store';

const Index = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
