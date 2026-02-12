import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { toast } from "./use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  avatar?: string;
  createdAt: string;
  provider?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, birthDate: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  deleteAccount: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user data
      apiCall('/auth/me')
        .then(data => {
          setUser(data.user);
        })
        .catch(error => {
          console.error('Token validation failed:', error);
          localStorage.removeItem('auth_token');
        });
    }
  }, []);

  const signup = async (name: string, email: string, password: string, birthDate: string): Promise<boolean> => {
    try {
      const data = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, birthDate }),
      });

      localStorage.setItem('auth_token', data.token);
      setUser(data.user);

      toast({
        title: "Account created successfully!",
        description: "Welcome to Moodboard Studio",
      });

      return true;
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('auth_token', data.token);
      setUser(data.user);

      toast({
        title: "Welcome back!",
        description: `Hello ${data.user.name}`,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      // For demo purposes, we'll simulate Google OAuth
      // In production, this would redirect to Google OAuth
      const data = await apiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          name: "Demo User",
          email: "demo@google.com",
          avatar: "https://via.placeholder.com/100",
          providerId: "google-demo-id"
        }),
      });

      localStorage.setItem('auth_token', data.token);
      setUser(data.user);

      toast({
        title: "Google login successful!",
        description: `Welcome ${data.user.name}`,
      });

      return true;
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const deleteAccount = async () => {
    try {
      await apiCall('/users/account', {
        method: 'DELETE',
      });

      localStorage.removeItem('auth_token');
      setUser(null);

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const data = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      setUser(data.user);

      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error('Update user error:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        logout,
        deleteAccount,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
