import React, { createContext, useContext, useState } from "react";
import { useEffect } from "react";
import {
  loginUserFromBackendServer,
  getUserDetails,
  updateUserAddresses,
} from "../actions/serverActions";

interface User {
  email: string;
  name: string;
  picture: string;
  userId?: string; // Add userId to User interface
}

interface Address {
  name: string;
  address: string;
  mobile: string;
  type: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  handleLogout: () => void;
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
  addNewAddress: (newAddress: Address) => Promise<void>;
  removeAddress: (index: number) => Promise<void>;
  isLoadingAddresses: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setInternalUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [addresses, setInternalAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const setAddresses = (newAddresses: Address[]) => {
    setInternalAddresses(newAddresses);
  };

  const addNewAddress = async (newAddress: Address) => {
    if (user?.userId) {
      const updatedAddresses = [...addresses, newAddress];
      const response = await updateUserAddresses(user.userId, updatedAddresses);
      if (!response.error) {
        setInternalAddresses(updatedAddresses);
      }
    }
  };

  const removeAddress = async (index: number) => {
    if (user?.userId) {
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      const response = await updateUserAddresses(user.userId, updatedAddresses);
      if (!response.error) {
        setInternalAddresses(updatedAddresses);
      }
    }
  };

  // Load user data and addresses on mount
  useEffect(() => {
    const checkAndRefreshUser = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setIsLoadingAddresses(true);
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

            console.log("Fetching user details for:", loginResponse.result._id);
            // Fetch user details including addresses
            const userDetails = await getUserDetails(loginResponse.result._id);
            if (
              !userDetails.error &&
              userDetails.result?.addresses?.length > 0
            ) {
              setAddresses(userDetails.result.addresses);
            }
          } else {
            console.error("Failed to refresh user data");
            // Optionally handle login failure
            // handleLogout();
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        } finally {
          setIsLoadingAddresses(false);
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
    setAddresses([]);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    handleLogout,
    addresses,
    setAddresses,
    addNewAddress,
    removeAddress,
    isLoadingAddresses,
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
