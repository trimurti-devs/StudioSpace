import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  avatar?: string;
  createdAt: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("current_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
  }, []);

  const signup = async (name: string, email: string, password: string, birthDate: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = localStorage.getItem(`user_${email}`);
    if (existingUser) {
      return false;
    }
    
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      birthDate,
      createdAt: new Date().toISOString(),
    };
    
    // Save user data
    localStorage.setItem(`user_${email}`, JSON.stringify({ ...newUser, password }));
    localStorage.setItem("current_user", JSON.stringify(newUser));
    
    setUser(newUser);
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const userData = localStorage.getItem(`user_${email}`);
    if (!userData) {
      return false;
    }

    const parsed = JSON.parse(userData);
    if (parsed.password !== password) {
      return false;
    }

    const { password: _, ...userWithoutPassword } = parsed;
    localStorage.setItem("current_user", JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // Simulate Google OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock Google user data
    const mockGoogleUser: User = {
      id: crypto.randomUUID(),
      name: "Demo User",
      email: "demo@google.com",
      birthDate: "1990-01-01",
      avatar: "https://via.placeholder.com/100",
      createdAt: new Date().toISOString(),
    };

    // Check if Google user already exists
    const existingUser = localStorage.getItem(`user_${mockGoogleUser.email}`);
    if (!existingUser) {
      // Create new Google user
      localStorage.setItem(`user_${mockGoogleUser.email}`, JSON.stringify({
        ...mockGoogleUser,
        provider: "google"
      }));
    }

    localStorage.setItem("current_user", JSON.stringify(mockGoogleUser));
    setUser(mockGoogleUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("current_user");
    setUser(null);
  };

  const deleteAccount = () => {
    if (user) {
      localStorage.removeItem(`user_${user.email}`);
      localStorage.removeItem("current_user");
      setUser(null);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("current_user", JSON.stringify(updatedUser));
      
      // Also update in users storage
      const userData = localStorage.getItem(`user_${user.email}`);
      if (userData) {
        const parsed = JSON.parse(userData);
        localStorage.setItem(`user_${user.email}`, JSON.stringify({ ...parsed, ...updates }));
      }
      
      setUser(updatedUser);
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
