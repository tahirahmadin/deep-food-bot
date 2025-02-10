import React, { useEffect, useState } from "react";
import {
  User,
  ShoppingBag,
  Home,
  Trash2,
  LogOut,
  Clock,
  ChevronRight,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../actions/serverActions";

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

interface Address {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isAuthenticated,
    handleLogout: authLogout,
    addresses,
    removeAddress,
    isLoadingAddresses,
  } = useAuth();
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const latestAddress = addresses[addresses.length - 1];

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && user?.userId) {
        setIsLoading(true);
        setError(null);
        try {
          console.log("Fetching orders for user:", user.userId);
          const response = await getUserOrders(user.userId);
          if (!response.error && response.result) {
            // console.log("Orders fetched successfully:", response.result);
            setOrders(response.result);
          } else {
            console.error("Failed to fetch orders:", response);
            setError("Failed to fetch orders");
          }
        } catch (err) {
          console.error("Error fetching orders:", err);
          setError("An error occurred while fetching orders");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();
  }, [isAuthenticated, user?.userId, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number): string => {
    return (amount / 100).toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 bg-orange-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              {isAuthenticated && user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-orange-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {isAuthenticated ? user?.name : "Guest User"}
              </h3>
              {isAuthenticated && (
                <p className="text-xs text-gray-600">{user?.email}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {latestAddress && (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">
                      {latestAddress.address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Orders Section */}
          <button
            onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium">Previous Orders</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                isOrdersExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOrdersExpanded && (
            <div className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-red-500 mb-2">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="text-primary hover:text-primary-600 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">
                    {isAuthenticated
                      ? "No orders yet"
                      : "Please log in to view your orders"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pl-4 pr-2 max-h-[40vh] overflow-y-auto">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="p-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-medium text-gray-900">
                                {order.restaurantName || "Restaurant"}
                              </h4>
                            </div>
                            <p className="text-[10px] text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-xs font-medium text-primary">
                              {(order.totalAmount / 100).toFixed(2)} AED
                            </p>
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                  order.status === "OUT_FOR_DELIVERY"
                                    ? "bg-green-100 text-green-700"
                                    : order.status === "PREPARING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {order.status === "PROCESSING" && (
                                  <span className="text-[9px] text-green-600">
                                    Order placed
                                  </span>
                                )}
                                {order.status === "COOKING" && (
                                  <span className="text-[9px] text-green-600">
                                    Preparing
                                  </span>
                                )}
                                {order.status === "OUT_FOR_DELIVERY" && (
                                  <span className="text-[9px] text-green-600">
                                    ETD: {order.estimatedDeliveryTime} mins
                                  </span>
                                )}
                                {order.status === "COMPLETED" && (
                                  <span className="text-[9px] text-green-600">
                                    Delivered
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-0.5"
                            >
                              <span className="text-[10px] text-gray-600">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {item.price.toFixed(2)} AED
                              </span>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-[10px] text-gray-500">
                              <span>Delivery to:</span>
                              <p className="text-gray-600">
                                {order.customerDetails.name} -{" "}
                                {order.customerDetails.phone}
                              </p>
                              <p className="text-gray-600">
                                {order.customerDetails.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Section */}
          <button
            onClick={() => setIsAddressesExpanded(!isAddressesExpanded)}
            className="w-full flex items-center justify-between p-3 mt-2 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5" />
              <span className="font-medium">Saved Addresses</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                isAddressesExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isAddressesExpanded && (
            <div className="mt-4 px-2">
              {addresses.map((addr, index) => (
                <div
                  key={index}
                  className="bg-white p-2 rounded-xl mb-2 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {addr.type}
                      </p>
                      <p className="text-xs  text-gray-500">
                        {addr.name} - {addr.address}
                      </p>
                      <p className="text-[11px]  text-gray-400">
                        {addr.mobile}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        removeAddress(index);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {isLoadingAddresses ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : addresses.length === 0 ? (
                <p className="text-center text-gray-500 text-sm pl-7">
                  No saved addresses
                </p>
              ) : null}
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={authLogout}
              className="mt-6 w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
};
