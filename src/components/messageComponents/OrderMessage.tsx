import React from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { Message, QueryType } from "../../types";
import { useChatContext } from "../../context/ChatContext";

interface OrderMessageProps {
  message: Message;
}

export const OrderMessage: React.FC<OrderMessageProps> = ({ message }) => {
  const { dispatch } = useChatContext();

  const handlePaymentMethodSelect = (method: "card" | "crypto") => {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: method });
    dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: `Please complete your ${
          method === "card" ? "card" : "USDT"
        } payment.`,
        isBot: true,
        time: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: QueryType.CHECKOUT,
      },
    });
  };

  try {
    const parsedContent = JSON.parse(message.text);
    if (parsedContent.orderSummary) {
      const { items, total, restaurant } = parsedContent.orderSummary;
      return (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Order Summary</h3>
            <span className="text-sm text-gray-500">{restaurant}</span>
          </div>

          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{item.quantity}x</span>
                  <span className="text-gray-800 text-xs">{item.name}</span>
                </div>
                <span className="text-gray-600 text-xs">
                  {(parseFloat(item.price) * item.quantity).toFixed(2)} AED
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">Total Amount</span>
              <span className="font-bold text-primary">{total} AED</span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-3">
              How would you like to pay?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePaymentMethodSelect("card")}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                Credit/Debit Card
              </button>
              <button
                onClick={() => handlePaymentMethodSelect("crypto")}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                Pay with USDT
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (parsedContent.success && parsedContent.orderDetails) {
      const { orderDetails } = parsedContent;
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm mb-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-primary/10 to-green-600/5 animate-gradient" />
          <div className="relative">
            <div className="text-center mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg animate-success-bounce">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-0.5">
                Order Confirmed!
              </h3>
              <p className="text-primary font-medium">
                {orderDetails.restaurant}
              </p>
            </div>

            {/* Order details and payment info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-2 shadow-inner">
              {/* Order items */}
              <div className="space-y-1 mb-3">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-800 font-medium">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} AED
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment details */}
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="text-lg font-bold text-primary">
                    {orderDetails.total} AED
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="text-xs font-medium text-gray-800 bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {orderDetails.paymentMethod === "card"
                      ? "Credit Card"
                      : "USDT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery details */}
            <div className="bg-white rounded-lg px-3 py-2 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Delivery Details
                </p>
              </div>
              <div className="space-y-0.5 pl-5">
                <p className="text-xs font-medium text-gray-800">
                  {orderDetails.deliveryDetails.name}
                </p>
                <p className="text-xs text-gray-600">
                  {orderDetails.deliveryDetails.address}
                </p>
                <p className="text-xs text-gray-600">
                  {orderDetails.deliveryDetails.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } catch (e) {
    // Not a JSON message, return simple text
    return <p className="text-gray-800 text-sm">{message.text}</p>;
  }

  return <p className="text-gray-800 text-sm">{message.text}</p>;
};
