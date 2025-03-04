import React, { createContext, useContext, useRef, useState } from "react";
import { useEffect } from "react";
import {
  loginUserFromBackendServer,
  getUserDetails,
  getUserOrders,
  updateUserAddresses,
} from "../actions/serverActions";

interface Order {
  _id: string;
  orderId: string;
  customerDetails: {
    name: string;
    address: string;
    phone: string;
  };
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    restaurant: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
  restaurantName: string;
  estimatedDeliveryTime: number;
}
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
  setInternalAddresses: (addresses: Address[]) => void;
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
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  isLoadingOrders: boolean;
  refreshOrders: () => Promise<void>;
  updateOrder: (updatedOrder: Order) => void;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const refreshOrdersRef = useRef<boolean>(false);
  const userDetailsRef = useRef<boolean>(false);

  const setAddresses = async (newAddresses: Address[]) => {
    if (user?.userId) {
      const response = await updateUserAddresses(user.userId, newAddresses);
      if (!response.error) {
        setInternalAddresses(newAddresses);
        return true;
      }
      return false;
    }
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
      if (savedUser && !userDetailsRef.current) {
        try {
          userDetailsRef.current = true;
          setIsLoadingAddresses(true);
          const userData = JSON.parse(savedUser);
          setInternalUser(userData);

          const userDetails = await getUserDetails(userData.userId);

          if (!userDetails.error && userDetails.result?.addresses?.length > 0) {
            setInternalAddresses(userDetails.result.addresses);
          } else {
            setIsAddressModalOpen(true);
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        } finally {
          setIsLoadingAddresses(false);
          userDetailsRef.current = false;
        }
      }
    };

    checkAndRefreshUser();
  }, [user?.userId]); // Only run when userId changes

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
    setInternalAddresses([]);
    userDetailsRef.current = false;
    refreshOrdersRef.current = false;
    setOrders([]);
    localStorage.removeItem("user");
  };

  const refreshOrders = async () => {
    // Skip if already refreshing or no user ID
    if (!user?.userId || refreshOrdersRef.current) {
      return;
    }

    try {
      refreshOrdersRef.current = true;
      setIsLoadingOrders(true);
      const response = await getUserOrders(user.userId);
      if (!response.error && response.result) {
        setOrders(response.result);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
      refreshOrdersRef.current = false;
    }
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    handleLogout,
    addresses,
    setAddresses,
    setInternalAddresses,
    removeAddress,
    isLoadingAddresses,
    isAddressModalOpen,
    setIsAddressModalOpen,
    editingAddress,
    setEditingAddress,
    orders,
    setOrders,
    isLoadingOrders,
    refreshOrders,
    updateOrder,
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
