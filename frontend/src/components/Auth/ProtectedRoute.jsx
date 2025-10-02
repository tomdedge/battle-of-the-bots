import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignIn } from './GoogleSignIn';
import { Loader, Center } from '@mantine/core';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <GoogleSignIn />;
  }

  return children;
};