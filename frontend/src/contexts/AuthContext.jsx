import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for token in URL (from OAuth callback in development)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        setToken(urlToken);
        localStorage.setItem('authToken', urlToken);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Decode JWT to get user info
        try {
          const payload = JSON.parse(atob(urlToken.split('.')[1]));
          setUser({
            id: payload.userId,
            googleId: payload.googleId,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
          });
        } catch (error) {
          console.error('Invalid token:', error);
        }
      } else if (token) {
        // Handle existing token from localStorage
        if (token === 'mock-jwt-token') {
          setUser({
            id: 'test-user-123',
            googleId: 'test-google-id',
            email: 'test@example.com',
            name: 'Test User',
            picture: null
          });
        } else {
          // Decode real JWT to get user info
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              id: payload.userId,
              googleId: payload.googleId,
              email: payload.email,
              name: payload.name,
              picture: payload.picture
            });
          } catch (error) {
            console.error('Invalid token:', error);
            logout();
          }
        }
      } else {
        // Check if authenticated via httpOnly cookie (production)
        try {
          const response = await fetch('/auth/status', {
            credentials: 'include' // Include cookies
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          }
        } catch (error) {
          console.log('Not authenticated via cookie');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/auth/google`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeTab'); // Clear saved tab on logout
    
    // Clear suggestion cache on logout
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('suggestions_')) {
        localStorage.removeItem(key);
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};