"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser, isAuthenticated, logoutUser } from "@/lib/api/auth";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Define the user type
interface User {
  id: string;
  email: string;
  name: string;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Export the auth provider component
export function UserAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuth = () => {
      // Get current user
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Check if the current route requires authentication
      const requiresAuth = ["/library"].includes(pathname || "");
      
      if (requiresAuth && !currentUser) {
        // Redirect to login page if authentication is required but user is not logged in
        router.push("/login");
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page.",
        });
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [pathname, router, toast]);
  
  // Logout function
  const logout = () => {
    logoutUser();
    setUser(null);
    router.push("/");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}