import React from "react";
import { X, MapPin, Clock, Package, Truck, CheckCircle } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
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
  };
}

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

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { theme } = useFiltersContext();
  const currentStep = getStatusStep(order.status);

  if (!isOpen) return null;

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
      description:
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        style={{ backgroundColor: `${theme.modalBg}80` }}
      />
      <div
        className="relative w-full max-w-md rounded-xl shadow-lg overflow-hidden animate-slide-up"
        style={{ backgroundColor: theme.modalBg }}
      >
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{
            backgroundColor: theme.modalBgLight,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: theme.modalMainText }}
              >
                Order #{order.orderId}
              </h3>
              <p
                className="text-sm opacity-70"
                style={{ color: theme.modalMainText }}
              >
                {order.restaurantName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" style={{ color: theme.modalMainText }} />
            </button>
          </div>
        </div>

        {/* Order Status */}
        <div className="p-4">
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
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
                          : `${theme.modalMainText}20`,
                      }}
                    />
                  )}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors`}
                    style={{
                      backgroundColor: isActive
                        ? theme.primary
                        : `${theme.modalMainText}20`,
                      color: isActive ? theme.background : theme.modalMainText,
                    }}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4
                      className="font-medium"
                      style={{ color: theme.modalMainText }}
                    >
                      {step.title}
                    </h4>
                    <p
                      className="text-sm opacity-70"
                      style={{ color: theme.modalMainText }}
                    >
                      {step.description}
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
          style={{
            backgroundColor: theme.modalBgLight,
            borderColor: theme.border,
          }}
        >
          <div className="space-y-4">
            {/* Items */}
            <div>
              <h4
                className="text-sm font-medium mb-2"
                style={{ color: theme.modalMainText }}
              >
                Order Items
              </h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs opacity-70"
                        style={{ color: theme.modalMainText }}
                      >
                        {item.quantity}x
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: theme.modalMainText }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: theme.modalMainText }}
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
                style={{ color: theme.modalMainText }}
              >
                Delivery Details
              </h4>
              <div
                className="p-3 rounded-lg space-y-2"
                style={{ backgroundColor: theme.modalBg }}
              >
                <div className="flex items-start gap-2">
                  <MapPin
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: theme.modalMainText }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: theme.modalMainText }}
                    >
                      {order.customerDetails.name}
                    </p>
                    <p
                      className="text-xs opacity-70"
                      style={{ color: theme.modalMainText }}
                    >
                      {order.customerDetails.address}
                    </p>
                    <p
                      className="text-xs opacity-70"
                      style={{ color: theme.modalMainText }}
                    >
                      {order.customerDetails.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm" style={{ color: theme.modalMainText }}>
                Total Amount
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: theme.primary }}
              >
                {(order.totalAmount / 100).toFixed(2)} AED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
