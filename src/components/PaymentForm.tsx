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
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!, {
  stripeAccount: "acct_1QnDfMRsmaUdhKRS",
});

// Checkout Form Component
const CheckoutForm: React.FC<{
  orderDetails: any;
  total: string;
  onSuccess: () => void;
}> = ({ orderDetails, total, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { dispatch } = useChatContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { error: cardError, paymentMethod } =
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

      if (cardError) {
        throw new Error(cardError.message);
      }

      // Create payment intent
      const response = await fetch(
        "https://payments.gobbl.ai/api/payment/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(parseFloat(total) * 100),
            currency: "aed",
            payment_method_id: paymentMethod.id,
            customer_details: {
              name: orderDetails.name,
              phone: orderDetails.phone,
            },
            shipping: {
              name: orderDetails.name,
              address: {
                line1: orderDetails.address,
              },
              phone: orderDetails.phone,
            },
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Set success state
      setIsSuccess(true);

      // Handle successful payment
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now(),
          text: JSON.stringify({
            text: `Payment successful! Your order for ${total} AED has been placed and will be delivered to ${orderDetails.address}. We'll send updates to ${orderDetails.phone}.`,
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
      <div className="bg-white/80 rounded-lg p-4 shadow-sm backdrop-blur-sm mb-3 max-w-sm mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Order Confirmed!
          </h3>
          <div className="flex items-center justify-center gap-2 mb-4">
            <PartyPopper className="w-5 h-5 text-primary" />
            <p className="text-primary font-medium">Thank you for your order</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Order Total</span>
              <span className="font-semibold text-gray-800">{total} AED</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Delivery To</span>
              <span className="text-sm text-gray-800 text-right">
                {orderDetails.address}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Contact</span>
              <span className="text-sm text-gray-800">
                {orderDetails.phone}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            We'll send order updates to your phone number
          </p>
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Estimated delivery time: 30-45 minutes</span>
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
          disabled={!stripe || isProcessing}
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
  const { state } = useChatContext();
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
      />
    </Elements>
  );
};
