import React from "react";
import { ShoppingBag, MapPin, Phone, Clock, Wallet } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useWallet } from "../context/WalletContext";

interface PaymentFormProps {
  onSubmit: (e: React.FormEvent) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit }) => {
  const { state, dispatch } = useChatContext();
  const { connected, connectWallet, transferUSDT } = useWallet();
  const { orderDetails } = state.checkout;

  const total = state.cart
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  // Convert AED to USDT (1 USDT = 3.3 AED)
  const usdtAmount = (parseFloat(total) / 3.3).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      await connectWallet();
      return;
    }

    try {
      const signature = await transferUSDT(parseFloat(usdtAmount));

      if (signature) {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now(),
            text: `🎉 Payment Successful! Transaction: ${signature.slice(
              0,
              8
            )}...
                  Your order will be delivered to ${orderDetails.address}. 
                  We'll send updates to ${
                    orderDetails.phone
                  }. Thank you for choosing Dunkin'!`,
            isBot: true,
            time: new Date().toLocaleTimeString(),
            queryType: "CHECKOUT",
          },
        });
        dispatch({ type: "CLEAR_CART" });
        dispatch({ type: "SET_CHECKOUT_STEP", payload: null });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now(),
          text: "Payment failed. Please try again.",
          isBot: true,
          time: new Date().toLocaleTimeString(),
          queryType: "CHECKOUT",
        },
      });
    }
    // Simulate payment processing
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: `🎉 Order Confirmed! Your order will be delivered to ${orderDetails.address} in approximately 30 minutes. We'll send updates to ${orderDetails.phone}. Thank you for choosing Dunkin'!`,
        isBot: true,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: "CHECKOUT",
      },
    });

    // Reset checkout state
    dispatch({ type: "SET_CHECKOUT_STEP", payload: null });
    // Clear cart
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <div className="bg-white/80 rounded-xl p-3 shadow-sm backdrop-blur-sm mb-4 max-w-sm mx-auto">
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl overflow-hidden p-3 text-white">
        {/* Illustration */}
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/food-delivery-boy-illustration-download-in-svg-png-gif-file-formats--on-scooter-home-location-online-pack-e-commerce-shopping-illustrations-3351728.png"
          alt="Delivery Illustration"
          className="absolute right-0 bottom-0 h-24 object-contain opacity-25"
        />

        {/* Order Total */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div>
            <p className="text-orange-100 text-xs">Order Total</p>
            <div>
              <p className="text-xl font-bold">{total} AED</p>
              <p className="text-sm text-orange-200">{usdtAmount} USDT</p>
            </div>
          </div>
          <p className="text-sm bg-white/10 px-3 py-1 rounded-full">
            30-45 min delivery
          </p>
        </div>

        {/* Delivery Details */}
        <div className="relative z-10 grid grid-cols-2 gap-2 text-sm border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-200" />
            <div>
              <p className="text-orange-100 text-xs">Address</p>
              <p className="font-medium text-xs line-clamp-1">
                {orderDetails.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-200" />
            <div>
              <p className="text-orange-100 text-xs">Contact</p>
              <p className="font-medium text-xs">{orderDetails.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        className="w-full p-3 mt-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        {connected
          ? `Pay ${usdtAmount} USDT & Place Order`
          : "Connect Wallet to Pay"}
      </button>

      <p className="text-xs text-center text-gray-500 mt-2">
        {connected
          ? `Send exactly ${usdtAmount} USDT to complete your order • 1 USDT = 3.3 AED`
          : "Connect your Phantom wallet to pay with USDT"}
      </p>
    </div>
  );
};
