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
  Coins,
  Gift,
  Wallet,
  Package,
  Truck,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { getUserDetails } from "../actions/serverActions";
import { useFiltersContext } from "../context/FiltersContext";

interface UserDetails {
  gobblBalance: number;
  totalOrders: number;
  totalOrdersValue: number;
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
    setIsAddressModalOpen,
    setEditingAddress,
    orders,
    isLoadingOrders,
    refreshOrders,
    updateOrder,
  } = useAuth();
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isAddressesExpanded, setIsAddressesExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    gobblBalance: 0,
    totalOrders: 0,
    totalOrdersValue: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { connected, publicKey } = useWallet();
  const { theme } = useFiltersContext();
  const [showMainPanel, setShowMainPanel] = useState(true);

  const [retryCount, setRetryCount] = useState(0);
  const latestAddress = addresses[addresses.length - 1];

  const getStatusStep = (status: string): number => {
    switch (status) {
      case "PROCESSING":
        return 1;
      case "COOKING":
        return 2;
      case "OUT_FOR_DELIVERY":
        return 3;
      case "COMPLETED":
        return 4;
      default:
        return 0;
    }
  };

  const statusSteps = [
    {
      title: "Order Placed",
      description: "Your order has been received",
      icon: Package,
      step: 1,
    },
    {
      title: "Preparing",
      description: "Chef is preparing your food",
      icon: Clock,
      step: 2,
    },
    {
      title: "Out for Delivery",
      description: (order: any) =>
        order.estimatedDeliveryTime === 0
          ? `Waiting for delivery agent.`
          : `Estimated delivery in ${order.estimatedDeliveryTime} mins`,
      icon: Truck,
      step: 3,
    },
    {
      title: "Delivered",
      description: "Order has been delivered",
      icon: CheckCircle,
      step: 4,
    },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.userId) {
        try {
          const details = await getUserDetails(user.userId);
          if (!details.error && details.result) {
            setUserDetails({
              gobblBalance: details.result.gobblBalance || 0,
              totalOrders: details.result.totalOrders || 0,
              totalOrdersValue: details.result.totalOrdersValue || 0,
            });
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
      refreshOrders();
    };
    fetchUserData();
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

  useEffect(() => {
    if (selectedOrder && selectedOrder._id) {
      let socketUrl = import.meta.env.VITE_PUBLIC_BACKEND_SOCKET_URL;
      const ws = new WebSocket(socketUrl);
      ws.onopen = () => {
        console.log("Order WebSocket connected for order", selectedOrder._id);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("SlidePanel Order WS message:", data);
          if (
            data.type === "orderUpdated" &&
            data.order &&
            data.order._id === selectedOrder._id
          ) {
            console.log("Updating selected order:", data.order);
            setSelectedOrder({ ...data.order });
            updateOrder && updateOrder(data.order);
          }
        } catch (error) {
          console.error("Error parsing order update:", error);
        }
      };
      ws.onerror = (err) => {
        console.error("Order WebSocket error:", err);
        ws.close();
      };
      ws.onclose = () => {
        console.log("Order WebSocket closed");
      };
      return () => {
        ws.close();
      };
    }
  }, [selectedOrder?._id]);

  useEffect(() => {
    if (isAuthenticated) {
      let socketUrl = import.meta.env.VITE_PUBLIC_BACKEND_SOCKET_URL;
      const ws = new WebSocket(socketUrl);
      ws.onopen = () => {
        console.log("Global orders WebSocket connected");
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Global WS message received:", data);
          if (data.type === "orderUpdated" && data.order) {
            // Update the global orders list automatically
            updateOrder && updateOrder(data.order);
          }
        } catch (error) {
          console.error("Error parsing global order update:", error);
        }
      };
      ws.onerror = (err) => {
        console.error("Global orders WS error:", err);
        ws.close();
      };
      ws.onclose = () => {
        console.log("Global orders WS closed");
      };
      return () => {
        ws.close();
      };
    }
  }, [isAuthenticated, updateOrder]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-[100] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: theme.slideBgOther }}
      >
        {showMainPanel ? (
          <div className="p-6" style={{ backgroundColor: theme.slideBgLight }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[20%] rounded-full bg-orange-100 flex items-center justify-center">
                {isAuthenticated && user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-orange-500" />
                )}
              </div>
              <div className="w-[80%]" style={{ color: theme.slideSecondText }}>
                <h3 className="font-semibold">
                  {isAuthenticated ? user?.name : "Guest User"}
                </h3>
                {isAuthenticated && (
                  <p className="text-xs opacity-80">{user?.email}</p>
                )}
                <div className="flex items-center gap-1 text-xs opacity-70">
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
        ) : (
          <div className="h-full overflow-y-auto">
            {/* Order Details Header */}
            <div
              className="p-4 border-b"
              style={{ backgroundColor: theme.slideBgLight }}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowMainPanel(true);
                    setSelectedOrder(null);
                  }}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: theme.slideSecondText }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: theme.slideSecondText }}
                  >
                    Order #{selectedOrder?.orderId}
                  </h3>
                  <p
                    className="text-sm opacity-70"
                    style={{ color: theme.slideSecondText }}
                  >
                    {selectedOrder?.restaurantName}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Status Timeline */}
            <div className="p-4">
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const currentStep = getStatusStep(selectedOrder?.status);
                  const isActive = currentStep >= step.step;
                  const StepIcon = step.icon;
                  return (
                    <div
                      key={step.step}
                      className="flex items-start gap-3 relative"
                    >
                      {index !== statusSteps.length - 1 && (
                        <div
                          className="absolute left-[14px] top-8 w-0.5 h-12"
                          style={{
                            backgroundColor: isActive
                              ? theme.primary
                              : `${theme.slideMainText}20`,
                          }}
                        />
                      )}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor: isActive
                            ? theme.primary
                            : `${theme.slideMainText}20`,
                          color: isActive
                            ? theme.background
                            : theme.slideMainText,
                        }}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4
                          className="font-medium"
                          style={{ color: theme.slideMainText }}
                        >
                          {step.title}
                        </h4>
                        <p
                          className="text-sm opacity-70"
                          style={{ color: theme.slideMainText }}
                        >
                          {typeof step.description === "function"
                            ? step.description(selectedOrder)
                            : step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div
              className="p-4 border-t"
              style={{ backgroundColor: theme.slideBgLight }}
            >
              <div className="space-y-4">
                {/* Items */}
                <div>
                  <h4
                    className="text-sm font-medium mb-2"
                    style={{ color: theme.slideSecondText }}
                  >
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder?.items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs opacity-70"
                            style={{ color: theme.slideSecondText }}
                          >
                            {item.quantity}x
                          </span>
                          <span
                            className="text-sm"
                            style={{ color: theme.slideSecondText }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: theme.slideSecondText }}
                        >
                          {item.price} AED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Details */}
                <div>
                  <h4
                    className="text-sm font-medium mb-2"
                    style={{ color: theme.slideSecondText }}
                  >
                    Delivery Details
                  </h4>
                  <div
                    className="p-3 rounded-lg space-y-2"
                    style={{ backgroundColor: theme.slideBg }}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: theme.slideMainText }}
                      />
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: theme.slideMainText }}
                        >
                          {selectedOrder?.customerDetails.name}
                        </p>
                        <p
                          className="text-xs opacity-70"
                          style={{ color: theme.slideMainText }}
                        >
                          {selectedOrder?.customerDetails.address}
                        </p>
                        <p
                          className="text-xs opacity-70"
                          style={{ color: theme.slideMainText }}
                        >
                          {selectedOrder?.customerDetails.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span
                    className="text-sm"
                    style={{ color: theme.slideSecondText }}
                  >
                    Total Amount
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: theme.primary }}
                  >
                    {(selectedOrder?.totalAmount / 100).toFixed(2)} AED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Section */}
        {isAuthenticated && (
          <div
            className="p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 border-b"
            style={{ backgroundColor: theme.slideBg }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full  flex items-center justify-center">
                  <Wallet
                    className="w-4 h-4 "
                    style={{ color: theme.primary }}
                  />
                </div>
                <div>
                  <h4
                    className="text-sm font-medium "
                    style={{ color: theme.slideMainText }}
                  >
                    Wallet Balance
                  </h4>
                  <p
                    className="text-xs opacity-70"
                    style={{ color: theme.slideMainText }}
                  >
                    {connected
                      ? `${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}`
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-primary">$0.00</p>
            </div>

            <div className="flex items-stretch gap-3">
              <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                  <h5 className="text-xs font-medium text-gray-700">
                    Order value
                  </h5>
                </div>

                <p className="text-lg font-bold text-gray-900">
                  {userDetails.totalOrdersValue.toFixed(2)} USD
                </p>
                <p className="text-[10px] text-gray-500">
                  ≈ {userDetails.totalOrders} orders
                </p>
              </div>

              <div className="flex-1 bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <h5 className="text-xs font-medium text-gray-700">
                    Airdrops
                  </h5>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {userDetails.gobblBalance.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-500">Gobbl allocation</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Orders Section */}
          <button
            onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
            className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
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
              {isLoadingOrders ? (
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
                      className="rounded-lg shadow-sm overflow-hidden"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowMainPanel(false);
                      }}
                      style={{
                        backgroundColor: theme.slideCardBg,
                        color: theme.cardText,
                      }}
                    >
                      <div className="p-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 opacity-90">
                              <h4 className="text-xs font-medium">
                                {order.restaurantName || "Restaurant"}
                              </h4>
                            </div>
                            <p className="text-[10px] opacity-70">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p
                              className="text-xs font-medium "
                              style={{ color: theme.primary }}
                            >
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
                        <div
                          className="mt-2 pt-2 border-t "
                          style={{ borderColor: theme.cardBorder }}
                        >
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-0.5"
                              style={{ color: theme.slideCardText }}
                            >
                              <span className="text-[10px] opacity-90">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-[11px] opacity-80">
                                {item.price} AED
                              </span>
                            </div>
                          ))}
                          <div
                            className="mt-2 pt-2"
                            style={{ borderColor: theme.cardBorder }}
                          >
                            <div className="text-[10px] opacity-80">
                              <span>Delivery to:</span>
                              <p className="opacity-70">
                                {order.customerDetails.name} -{" "}
                                {order.customerDetails.phone}
                              </p>
                              <p className="opacity-70">
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
            className="w-full flex items-center justify-between p-3 mt-2 rounded-xl transition-colors"
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
                  className=" p-2 rounded-xl mb-2 shadow-sm"
                  style={{
                    backgroundColor: theme.slideCardBg,
                    color: theme.cardText,
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{addr.type}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddress({ ...addr, index });
                            setIsAddressModalOpen(true);
                          }}
                          className="text-[10px] text-primary hover:text-primary-600"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-xs opacity-70">
                        {addr.name} - {addr.address}
                      </p>
                      <p className="text-[11px] opacity-60">{addr.mobile}</p>
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
