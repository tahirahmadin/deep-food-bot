import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  CreditCard,
  Lock,
  CheckCircle2,
  PartyPopper,
  Gift,
  Star,
  Wallet,
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getUserOrders } from "../actions/serverActions";
import { stripeService } from "../services/stripeService";
import { useWallet } from "../context/WalletContext";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRestaurant } from "../context/RestaurantContext";

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51QnDfMRsmaUdhKRSXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  {
    stripeAccount: "acct_1QnDfMRsmaUdhKRS",
  }
);

// Card Element styles
const cardStyle = {
  style: {
    base: {
      color: "#424770",
      letterSpacing: "0.025em",
      fontFamily: "Source Code Pro, monospace",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

// Checkout Form Component
const CheckoutForm: React.FC<{
  orderDetails: any;
  total: string;
  onSuccess: () => void;
  cart: any[];
  selectedPaymentMethod: string;
}> = ({ orderDetails, total, onSuccess, cart, selectedPaymentMethod }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { dispatch, state } = useChatContext();
  const { refreshOrders } = useAuth();
  const { state: restaurantState } = useRestaurant();
  const { user } = useAuth();
  const { connectWallet, transferUSDT, connected, account } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        setCurrentNetwork(chainId);
      }
    };
    checkNetwork();
  }, []);

  const switchNetwork = async (chainId: string) => {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });

      setCurrentNetwork(chainId);
    } catch (err: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              chainId === "0x38"
                ? {
                    chainId: "0x38",
                    chainName: "Binance Smart Chain",
                    nativeCurrency: {
                      name: "BNB",
                      symbol: "BNB",
                      decimals: 18,
                    },
                    rpcUrls: ["https://bsc-dataseed.binance.org/"],
                    blockExplorerUrls: ["https://bscscan.com/"],
                  }
                : {
                    chainId: "0x2105",
                    chainName: "Base",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://mainnet.base.org"],
                    blockExplorerUrls: ["https://basescan.org"],
                  },
            ],
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      }
      console.error("Error switching network:", err);
    }
  };

  useEffect(() => {
    if (selectedPaymentMethod === "card" && user?.userId) {
      const createIntent = async () => {
        try {
          const secret = await stripeService.createPaymentIntent(
            cart,
            orderDetails,
            state.selectedRestaurant || "Unknown Restaurant",
            user.userId,
            restaurantState.activeRestroId
          );
          setClientSecret(secret);
        } catch (error) {
          console.error("Error creating payment intent:", error);
          setError("Failed to initialize payment. Please try again.");
        }
      };
      createIntent();
    }
  }, [
    selectedPaymentMethod,
    cart,
    orderDetails,
    state.selectedRestaurant,
    user?.userId,
  ]);

  const handleCardPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: orderDetails.name,
              phone: orderDetails.phone,
              address: {
                line1: orderDetails.address,
              },
            },
          },
        });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === "succeeded") {
        // Show success animation
        setShowSuccessAnimation(true);

        // Wait for the order to be processed and refresh orders
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refreshOrders();

        setIsSuccess(true);
        handlePaymentSuccess();
      }
    } catch (error) {
      console.error("Payment failed:", error);
      setError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!connected) {
        await connectWallet();
      }

      // Calculate USDT amount (assuming 1 AED = 0.27 USDT)
      const usdtAmount = parseFloat(total) * 0.27;

      // Transfer USDT
      const signature = await transferUSDT(usdtAmount);

      if (!signature) {
        throw new Error("USDT transfer failed");
      }

      setShowSuccessAnimation(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (user?.userId) {
        await getUserOrders(user.userId);
      }

      setIsSuccess(true);
      handlePaymentSuccess();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Crypto payment failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPaymentMethod === "card") {
      await handleCardPayment();
    } else {
      await handleCryptoPayment();
    }
  };

  const handlePaymentSuccess = () => {
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: "🎉 Order Confirmed! Your delicious food is being prepared with care.",
        isBot: true,
        time: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: "CHECKOUT",
      },
    });

    dispatch({ type: "CLEAR_CART" });
    dispatch({ type: "SET_CHECKOUT_STEP", payload: null });
    onSuccess();
  };

  if (isSuccess) {
    return (
      <div className="bg-white/80 rounded-xl p-4 shadow-sm backdrop-blur-sm mb-3 max-w-sm mx-auto relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10">
          {showSuccessAnimation && (
            <>
              <div className="absolute inset-0 pointer-events-none">
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
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-success-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <div className="absolute top-4 left-4 animate-float-1">
            <PartyPopper className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="absolute top-4 right-4 animate-float-2">
            <Gift className="w-6 h-6 text-primary" />
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Order Confirmed!
          </h3>
          <p className="text-primary font-medium mb-6">
            Thank you for your order
          </p>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Order Total</span>
              <span className="font-bold text-gray-900">{total} AED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Delivery To</span>
              <span className="text-sm text-gray-700">
                {orderDetails.address}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-500">
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

        <div className="relative z-10 flex items-center justify-between mb-2">
          <div>
            <p className="text-orange-100 text-[10px]">Order Total</p>
            <p className="text-lg font-bold">{total} AED</p>
          </div>
          <p className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            30-45 min delivery
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-1.5 text-xs border-t border-white/10 pt-2">
          <div className="flex items-center gap-1.5">
            <div>
              <p className="text-orange-100 text-[10px]">Address</p>
              <p className="font-medium text-[10px] line-clamp-1">
                {orderDetails.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div>
              <p className="text-orange-100 text-[10px]">Contact</p>
              <p className="font-medium text-[10px]">{orderDetails.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {selectedPaymentMethod === "card" ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Card Details
            </label>
            <div className="w-full p-3 border border-gray-200 rounded-lg">
              <CardElement
                options={cardStyle}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Select Network
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => switchNetwork("0x2105")}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    currentNetwork === "0x2105"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Base Chain
                </button>
                <button
                  onClick={() => switchNetwork("0x38")}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${
                    currentNetwork === "0x38"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  BSC
                </button>
              </div>
              {currentNetwork &&
                currentNetwork !== "0x2105" &&
                currentNetwork !== "0x38" && (
                  <p className="text-xs text-red-500 mt-1">
                    Please switch to either Base Chain or BSC to continue
                  </p>
                )}
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount in USDT</span>
              <span className="font-bold text-gray-900">
                {(parseFloat(total) * 0.27).toFixed(2)} USDT
              </span>
            </div>
            <div className="text-xs text-gray-500">
              <p>Recipient Address:</p>
              <p className="font-mono text-[10px] break-all">
                0xeBB825f034519927D2c54171d36B4801DEf2A6B1
              </p>
            </div>
          </div>

          {!connected ? (
            <button
              onClick={connectWallet}
              className="w-full p-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
            >
              Connect Metamask
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={
                isProcessing ||
                (currentNetwork !== "0x2105" && currentNetwork !== "0x38")
              }
              className="w-full p-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Pay with USDT"}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {error}
        </div>
      )}

      {selectedPaymentMethod === "card" && (
        <form onSubmit={handleSubmit} className="mt-3">
          <button
            type="submit"
            disabled={!stripe || !cardComplete || !clientSecret || isProcessing}
            className="w-full p-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Wallet className="w-3.5 h-3.5" />
            {isProcessing ? "Processing..." : `Pay ${total} AED & Place Order`}
          </button>
        </form>
      )}

      <p className="text-[10px] text-center text-gray-500">
        <Lock className="w-3 h-3 inline-block mr-1" />
        Payments are secure and encrypted
      </p>
    </div>
  );
};

// Main Payment Form Component
interface PaymentFormProps {
  onSubmit: (e: React.FormEvent) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit }) => {
  const { state, dispatch } = useChatContext();
  const { orderDetails, paymentMethod } = state.checkout;

  if (!paymentMethod) {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: "card" });
  }

  const total = state.cart
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  return (
    <Elements stripe={stripePromise}>
      <div className="w-full max-w-md mx-auto">
        <CheckoutForm
          orderDetails={orderDetails}
          total={total}
          onSuccess={onSubmit}
          selectedPaymentMethod={paymentMethod || "card"}
          cart={state.cart}
        />
      </div>
    </Elements>
  );
};
