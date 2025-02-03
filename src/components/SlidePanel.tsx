import React, { useEffect, useState } from "react";
import {
  User,
  MapPin,
  ShoppingBag,
  Gift,
  Award,
  Home,
  Trash2,
  LogOut,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../actions/serverActions";

interface Order {
  id: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  total: string;
  status: string;
  createdAt: string;
  restaurant: string;
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
  savedAddresses: Address[];
  onDeleteAddress: (id: string) => void;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  isOpen,
  onClose,
  savedAddresses,
  onDeleteAddress,
}) => {
  const { user, isAuthenticated, handleLogout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = React.useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const latestAddress = savedAddresses[savedAddresses.length - 1];

  useEffect(() => {
    const fetchOrders = async () => {
      if (isAuthenticated && user?.userId && activeTab === "orders") {
        setIsLoading(true);
        setError(null);
        try {
          console.log("Fetching orders for user:", user.userId);
          const response = await getUserOrders(user.userId);
          if (!response.error && response.result) {
            console.log("Orders fetched successfully:", response.result);
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
  }, [isAuthenticated, user?.userId, activeTab, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
                <p className="text-sm text-gray-600">{user?.email}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500">
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

          {activeTab === "orders" && (
            <div className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600">Loading orders...</span>
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
                <div className="text-center text-gray-500 py-8">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  {isAuthenticated ? (
                    <p>You haven't placed any orders yet</p>
                  ) : (
                    <p>Please log in to view your orders</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 px-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {order.restaurant}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-primary">
                            {order.total} AED
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-500">
                              {item.price} AED
                            </span>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-3 py-2 text-xs text-primary hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                        View Details
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={authLogout}
              className="mt-4 w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}

          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Gobbl Points</span>
              <span className="text-orange-500 font-semibold">2,450</span>
            </div>
            <div className="mt-2 h-2 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-orange-500 rounded-full" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              550 points until next reward
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {[
              { id: "orders", icon: ShoppingBag, label: "Previous Orders" },
              { id: "addresses", icon: Home, label: "Saved Addresses" },
              { id: "points", icon: Award, label: "Points & Rewards" },
              { id: "deals", icon: Gift, label: "Special Offers" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? "bg-orange-50 text-orange-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === "orders" && (
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
                <div className="space-y-3 px-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {order.restaurant}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-primary">
                              {order.total} AED
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                order.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="mt-2 text-xs text-primary hover:text-primary-600 transition-colors"
                        >
                          {expandedOrderId === order.id
                            ? "Hide Details"
                            : "View Details"}
                        </button>
                        {expandedOrderId === order.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-1"
                              >
                                <span className="text-sm text-gray-600">
                                  {item.quantity}x {item.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {item.price} AED
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="mt-4 px-4">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white p-3 rounded-xl mb-3 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {addr.address}
                      </p>
                      <p className="text-xs text-gray-500">{addr.phone}</p>
                    </div>
                    <button
                      onClick={() => onDeleteAddress(addr.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {savedAddresses.length === 0 && (
                <p className="text-center text-gray-500 text-sm">
                  No saved addresses
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
