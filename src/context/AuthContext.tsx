import React, { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import { loginUserFromBackendServer } from "../actions/serverActions";

interface User {
  email: string;
  name: string;
  picture: string;
  userId?: string; // Add userId to User interface
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setInternalUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const checkAndRefreshUser = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          // Call backend login to get latest _id
          const loginResponse = await loginUserFromBackendServer(
            "GMAIL",
            userData.email
          );

          if (!loginResponse.error && loginResponse.result) {
            // Update user with latest data from backend
            const updatedUser = {
              ...userData,
              userId: loginResponse.result._id,
            };
            setUser(updatedUser);
          } else {
            console.error("Failed to refresh user data");
            // Optionally handle login failure
            // handleLogout();
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }
    };

    checkAndRefreshUser();
  }, []); // Run once on mount

  const setUser = (newUser: User | null) => {
    setInternalUser(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
