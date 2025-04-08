import { 
  createContext, 
  ReactNode, 
  useContext, 
  useState, 
  useEffect 
} from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

// Type definitions
type LoginCredentials = {
  email: string;
  password?: string;
};

type RegisterData = {
  name: string;
  email: string;
};

type AdminLoginCredentials = {
  email: string;
  password: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  adminLogin: (credentials: AdminLoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

// Create a default context value
const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: false,
  isAdmin: false,
  error: null,
  login: async () => { throw new Error('Not implemented'); },
  adminLogin: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Query to get current user
  const {
    data,
    error,
    isLoading,
    isSuccess,
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.status === 401) {
          return null;
        }
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return await res.json() as User;
      } catch (err) {
        console.error("Auth error:", err);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  // Safe user value that is never undefined
  const user = data || null;

  // Set first load flag to false after initial user fetch
  useEffect(() => {
    if (isSuccess && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [isSuccess, isFirstLoad]);

  // Login mutation for regular users
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/login", { 
        email: credentials.email,
        password: credentials.password || ""
      });
      return await res.json() as User;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome${userData.name ? `, ${userData.name}` : ''}!`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Login failed",
        description: err.message || "Failed to login",
        variant: "destructive",
      });
    },
  });

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: AdminLoginCredentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json() as User;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Admin login successful",
        description: `Welcome, ${userData.name || 'Admin'}!`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Admin login failed",
        description: err.message || "Failed to login",
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", {
        name: data.name,
        email: data.email
      });
      return await res.json() as User;
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Registration failed",
        description: err.message || "Failed to register",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Logout failed",
        description: err.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const adminLogin = async (credentials: AdminLoginCredentials) => {
    await adminLoginMutation.mutateAsync(credentials);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Check if user is admin
  const isAdmin = Boolean(user?.isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading && isFirstLoad, // Only show loading on first load
        isAdmin,
        error: error as Error | null,
        login,
        adminLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}