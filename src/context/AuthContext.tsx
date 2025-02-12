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
  userId?: string;
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
  addNewAddress: (newAddress: {
    name: string;
    address: string;
    mobile: string;
    type: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }) => Promise<boolean>;
  removeAddress: (index: number) => Promise<boolean>;
  isLoadingAddresses: boolean;
  isAddressModalOpen: boolean;
  setIsAddressModalOpen: (isOpen: boolean) => void;
  editingAddress: ({ index: number } & Address) | null;
  setEditingAddress: (address: ({ index: number } & Address) | null) => void;
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
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<
    ({ index: number } & Address) | null
  >(null);

  const setAddresses = async (newAddresses: Address[]) => {
    if (user?.userId) {
      const response = await updateUserAddresses(user.userId, newAddresses);
      if (!response.error) {
        setInternalAddresses(newAddresses);
      }
    }
  };

  const addNewAddress = async (newAddress: Address): Promise<boolean> => {
    if (user?.userId) {
      const updatedAddresses = [...addresses, newAddress];
      try {
        const response = await updateUserAddresses(
          user.userId,
          updatedAddresses
        );
        if (!response.error) {
          setInternalAddresses(updatedAddresses);
          return true;
        }
        throw new Error("Failed to update addresses");
      } catch (error) {
        console.error("Error saving address:", error);
        return false;
      }
    }
    console.error("No user ID available");
    return false;
  };

  const removeAddress = async (index: number): Promise<boolean> => {
    if (user?.userId) {
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      try {
        const response = await updateUserAddresses(
          user.userId,
          updatedAddresses
        );
        if (!response.error) {
          setInternalAddresses(updatedAddresses);
          return true;
        }
        throw new Error("Failed to remove address");
      } catch (error) {
        console.error("Error removing address:", error);
        return false;
      }
    }
    console.error("No user ID available");
    return false;
  };

  useEffect(() => {
    const checkAndRefreshUser = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setIsLoadingAddresses(true);
          const userData = JSON.parse(savedUser);
          const loginResponse = await loginUserFromBackendServer(
            "GMAIL",
            userData.email
          );

          if (!loginResponse.error && loginResponse.result) {
            const updatedUser = {
              ...userData,
              userId: loginResponse.result._id,
            };
            setUser(updatedUser);

            console.log("Fetching user details for:", loginResponse.result._id);
            const userDetails = await getUserDetails(loginResponse.result._id);
            if (
              !userDetails.error &&
              userDetails.result?.addresses?.length > 0
            ) {
              setAddresses(userDetails.result.addresses);
            }
          } else {
            console.error("Failed to refresh user data");
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };

    checkAndRefreshUser();
  }, []);

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
    isAddressModalOpen,
    setIsAddressModalOpen,
    editingAddress,
    setEditingAddress,
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
