import React, { useState } from "react";
import {
  ShoppingBag,
  MapPin,
  Phone,
  Clock,
  Wallet,
  CreditCard,
  Lock,
  CheckCircle2,
  PartyPopper,
  Gift,
  Star,
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../actions/serverActions";
import { stripeService } from "../services/stripeService";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeCardElement } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!, {
  stripeAccount: "acct_1QnDfMRsmaUdhKRS",
});

// Checkout Form Component
const CheckoutForm: React.FC<{
  orderDetails: any;
  total: string;
  onSuccess: () => void;
  cart: any[];
}> = ({ orderDetails, total, onSuccess, cart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { dispatch, state } = useChatContext();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: orderDetails.name,
            phone: orderDetails.phone,
            address: {
              line1: orderDetails.address,
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Process payment with our backend
      await stripeService.processPayment(
        paymentMethod!.id,
        cart,
        orderDetails,
        state.selectedRestaurant || "Unknown Restaurant"
      );

      // Show success animation
      setShowSuccessAnimation(true);

      // Wait a bit for the order to be processed on the backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch updated orders and retry if not found
      if (user?.userId) {
        let retries = 3;
        let ordersResponse;

        while (retries > 0) {
          ordersResponse = await getUserOrders(user.userId);
          if (!ordersResponse.error && ordersResponse.result?.length > 0) {
            // Check if the latest order matches our current order
            const latestOrder = ordersResponse.result[0];
            const currentTotal = state.cart
              .reduce(
                (sum, item) => sum + parseFloat(item.price) * item.quantity,
                0
              )
              .toFixed(2);

            if (
              parseFloat(latestOrder.totalAmount) ===
              parseFloat(currentTotal) * 100
            ) {
              break;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries--;
        }
      }

      // Set success state
      setIsSuccess(true);

      // Handle successful payment
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now(),
          text: JSON.stringify({
            text: "🎉 Order Confirmed! Your delicious food is being prepared with care.",
            items1: [],
            items2: [],
          }),
          isBot: true,
          time: new Date().toLocaleTimeString(),
          queryType: "CHECKOUT",
        },
      });

      // Clear cart and reset checkout
      dispatch({ type: "CLEAR_CART" });
      dispatch({ type: "SET_CHECKOUT_STEP", payload: null });
      onSuccess();
    } catch (error) {
      console.error("Payment failed:", error);
      setError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white/80 rounded-xl p-4 shadow-sm backdrop-blur-sm mb-3 max-w-sm mx-auto relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10">
          {showSuccessAnimation && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                {/* Stars */}
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={`star-${i}`}
                    className={`absolute w-4 h-4 text-yellow-400 animate-float-${
                      i + 1
                    }`}
                    style={{
                      left: `${15 + i * 20}%`,
                      top: `${10 + Math.random() * 20}%`,
                    }}
                  />
                ))}

                {/* Confetti */}
                {[...Array(15)].map((_, i) => (
                  <div
                    key={`confetti-${i}`}
                    className={`absolute w-2 h-2 rounded-full animate-confetti-${
                      (i % 5) + 1
                    }`}
                    style={{
                      left: `${(i * 100) / 15}%`,
                      backgroundColor: [
                        "#FF6B6B",
                        "#4ECDC4",
                        "#45B7D1",
                        "#96CEB4",
                        "#FFD93D",
                      ][i % 5],
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="relative text-center animate-fade-in-up">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-success-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          {/* Celebration Icons */}
          <div className="absolute top-4 left-4 animate-float-1">
            <PartyPopper className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="absolute top-4 right-4 animate-float-2">
            <Gift className="w-6 h-6 text-primary" />
          </div>

          {/* Order Status */}
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Order Confirmed!
          </h3>
          <p className="text-primary font-medium mb-6">
            Thank you for your order
          </p>

          {/* Order Details */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Order Total</span>
              <span className="font-bold text-gray-900">{total} AED</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Delivery To</span>
              <div className="flex items-center gap-1 text-right">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {orderDetails.address}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Contact</span>
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {orderDetails.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
            <Clock className="w-3 h-3" />
            <span>Estimated delivery: 30-45 minutes</span>
          </div>

          {/* Order Updates */}
          <div className="text-xs text-gray-500">
            Order updates will be sent to your phone
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white/80 rounded-lg p-2.5 shadow-sm backdrop-blur-sm mb-3 max-w-sm mx-auto">
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg overflow-hidden p-2.5 text-white">
        <div className="absolute right-2 top-2">
          <Lock className="w-4 h-4 text-orange-200" />
        </div>

        {/* Order Total */}
        <div className="relative z-10 flex items-center justify-between mb-2">
          <div>
            <p className="text-orange-100 text-[10px]">Order Total</p>
            <p className="text-lg font-bold">{total} AED</p>
          </div>
          <p className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            30-45 min delivery
          </p>
        </div>

        {/* Delivery Details */}
        <div className="relative z-10 grid grid-cols-2 gap-1.5 text-xs border-t border-white/10 pt-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange-200" />
            <div>
              <p className="text-orange-100 text-[10px]">Address</p>
              <p className="font-medium text-[10px] line-clamp-1">
                {orderDetails.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-orange-200" />
            <div>
              <p className="text-orange-100 text-[10px]">Contact</p>
              <p className="font-medium text-[10px]">{orderDetails.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="mt-3 space-y-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Card Details
          </label>
          <div className="w-full p-3 border border-gray-200 rounded-lg">
            <CardElement
              onChange={(e) => setCardComplete(e.complete)}
              options={{
                style: {
                  base: {
                    fontSize: "14px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isProcessing || !cardComplete}
          className="w-full p-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Wallet className="w-3.5 h-3.5" />
          {isProcessing ? "Processing..." : `Pay ${total} AED & Place Order`}
        </button>

        <p className="text-[10px] text-center text-gray-500">
          <Lock className="w-3 h-3 inline-block mr-1" />
          Payments are secure and encrypted
        </p>
      </form>
    </div>
  );
};

// Main Payment Form Component
interface PaymentFormProps {
  onSubmit: (e: React.FormEvent) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit }) => {
  const { state, dispatch } = useChatContext();
  const { orderDetails } = state.checkout;

  const total = state.cart
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        orderDetails={orderDetails}
        total={total}
        onSuccess={onSubmit}
        cart={state.cart}
      />
    </Elements>
  );
};
