import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignIn } from './GoogleSignIn';
import { Center, Box } from '@mantine/core';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh" style={{ backgroundColor: '#ffffff' }}>
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0A8FA8 0%, #1D9BBB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: 0.9
            }}
          />
        </Box>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.8; }
            }
          `}
        </style>
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <GoogleSignIn />;
  }

  return children;
};