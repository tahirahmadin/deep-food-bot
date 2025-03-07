import React, { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle2,
  PartyPopper,
  Gift,
  Star,
  Wallet,
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
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
import { useFiltersContext } from "../context/FiltersContext";

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
  const { theme } = useFiltersContext();
  const { refreshOrders } = useAuth();
  const { state: restaurantState } = useRestaurant();
  const { user } = useAuth();
  const {
    connectWallet,
    disconnectWallet,
    transferUSDT,
    connected,
    publicKey,
    balance,
    switchNetwork: walletSwitchNetwork,
  } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const checkOrderStatus = async (orderId: string) => {
    try {
      const status = await stripeService.getOrderStatus(orderId);
      return status;
    } catch (error) {
      console.error("Error checking order status:", error);
      throw error;
    }
  };

  const pollOrderStatus = async (orderId: string) => {
    setIsCheckingStatus(true);
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute maximum

    const poll = async () => {
      try {
        const status = await checkOrderStatus(orderId);
        setOrderStatus(status);

        if (status === "succeeded") {
          setShowSuccessAnimation(true);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await refreshOrders();
          setIsSuccess(true);
          handlePaymentSuccess();
          setIsCheckingStatus(false);
          return;
        } else if (status === "failed") {
          setError("Payment verification failed. Please try again.");
          setIsCheckingStatus(false);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          setError("Payment verification timeout. Please contact support.");
          setIsCheckingStatus(false);
          return;
        }

        // Poll again after 2 seconds
        setTimeout(poll, 2000);
      } catch (error) {
        setError("Error verifying payment. Please contact support.");
        setIsCheckingStatus(false);
      }
    };

    await poll();
  };

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
      await walletSwitchNetwork(chainId);
      setCurrentNetwork(chainId);
    } catch (error) {
      console.error("Error switching network:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (selectedPaymentMethod === "card" && user?.userId) {
      const createIntent = async () => {
        setError(null);
        try {
          let sellerId = "";
          if (restaurantState.activeRestroId) {
            let selectedRestro = restaurantState.restaurants.find(
              (ele) => ele.id === restaurantState.activeRestroId
            );

            if (selectedRestro) {
              sellerId = selectedRestro.stripeAccountId;
              console.log("Found Stripe account ID:", sellerId);
            } else {
              console.error(
                "Restaurant not found:",
                restaurantState.activeRestroId
              );
              setError("Restaurant configuration error");
              return;
            }
          }

          const secret = await stripeService.createPaymentIntent(
            cart,
            orderDetails,
            state.selectedRestaurant || "Unknown Restaurant",
            user.userId,
            restaurantState.activeRestroId,
            sellerId
          );
          setClientSecret(secret);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Error creating payment intent:", errorMessage);
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
    restaurantState.activeRestroId,
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

      let cryptoDepositAddress = "";
      if (restaurantState.activeRestroId) {
        let selectedRestro = restaurantState.restaurants.find(
          (ele) => ele.id === restaurantState.activeRestroId
        );

        if (selectedRestro) {
          cryptoDepositAddress = selectedRestro.bscBaseDepositAddress;
        }

        cryptoDepositAddress =
          restaurantState.restaurants[restaurantState.activeRestroId]
            .bscBaseDepositAddress;
      }

      // Calculate USDT amount (assuming 1 AED = 0.27 USDT)
      const usdtAmount = parseFloat(total) * 0.27;

      // Transfer USDT
      const { signature, network } = await transferUSDT(
        usdtAmount,
        cryptoDepositAddress
      );
      if (!signature || !network) {
        throw new Error("USDT transfer failed");
      }

      // Add transaction details to order details
      const orderDetailsWithTx = {
        ...orderDetails,
        transactionHash: signature,
        network: network,
      };

      // Create order in backend after successful USDT transfer
      const orderResponse = await stripeService.createCryptoOrder(
        cart,
        orderDetailsWithTx,
        state.selectedRestaurant || "Unknown Restaurant",
        user.userId,
        restaurantState.activeRestroId,
        cryptoDepositAddress
      );

      console.log(orderResponse);

      if (orderResponse && orderResponse?.result?.orderId) {
        // Start polling for order status
        await pollOrderStatus(orderResponse?.result?.orderId);
      } else {
        throw new Error("No order ID received from server");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Crypto payment failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let paymentStatus = await stripeService.createCashIntent(
        cart,
        orderDetails,
        state.selectedRestaurant || "Unknown Restaurant",
        user.userId,
        restaurantState.activeRestroId
      );

      console.log(paymentStatus);
      if (paymentStatus) {
        // Show success animation
        setShowSuccessAnimation(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPaymentMethod === "card") {
      if (!stripe || !elements || !clientSecret) {
        setError("Payment system not ready. Please try again.");
        return;
      }
      await handleCardPayment();
    } else if (selectedPaymentMethod === "cash") {
      await handleCashPayment();
    } else {
      if (!connected) {
        await connectWallet();
        return;
      }
      await handleCryptoPayment();
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh orders after successful payment
    refreshOrders();

    // Get first item image for the success card
    const firstItemImage = cart[0]
      ? `${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${
          restaurantState.activeRestroId
        }/${restaurantState.activeRestroId}-${cart[0].id}.jpg`
      : null;

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: JSON.stringify({
          success: true,
          orderDetails: {
            items: cart.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total: total,
            paymentMethod: selectedPaymentMethod,
            deliveryDetails: {
              name: orderDetails.name,
              address: orderDetails.address,
              phone: orderDetails.phone,
            },
            restaurant: state.selectedRestaurant,
            firstItemImage,
          },
        }),
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

  const getCardStyle = (color: string) => ({
    style: {
      base: {
        color: color || "#f9f9f9", // Default to white if no color is provided
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
  });

  return (
    <div
      className=" rounded-lg p-2.5 shadow-sm backdrop-blur-sm mb-3 max-w-sm mx-auto"
      style={{ backgroundColor: theme.cardBg, color: theme.cardText }}
    >
      {/* Loading Overlay */}
      {isCheckingStatus && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Verifying Payment</p>
            <p className="text-sm text-gray-500 mt-2">Please wait...</p>
          </div>
        </div>
      )}

      {/* Order Summary Card */}
      <div
        className="relative  rounded-lg overflow-hidden p-2.5 text-white"
        style={{
          color: theme.background,
          backgroundColor: theme.primary,
        }}
      >
        <div className="absolute right-2 top-2">
          <Lock className="w-4 h-4 " />
        </div>

        <div className="relative z-10 flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px]">Order Total</p>
            <p className="text-lg font-bold">{total} AED</p>
          </div>

          <p className="text-xs px-2 py-0.5 rounded-full">
            {" "}
            {selectedPaymentMethod === "cash"
              ? "In store order"
              : "30-45 min delivery"}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-1.5 text-xs border-t border-white/10 pt-2">
          <div className="flex items-center gap-1.5">
            <div>
              <p className=" text-[10px]">Address</p>
              <p className="font-medium text-[10px] line-clamp-1">
                {orderDetails.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div>
              <p className="text-[10px]">Contact</p>
              <p className="font-medium text-[10px]">{orderDetails.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Forms */}
      {selectedPaymentMethod === "card" && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: theme.text }}>
              Card Details
            </label>
            <div className="w-full p-3 border border-gray-200 rounded-lg">
              <CardElement
                options={getCardStyle(theme.text)}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </div>
          </div>
        </form>
      )}

      {selectedPaymentMethod === "crypto" && (
        <div className="mt-3 space-y-4">
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            {/* Connected Wallet Info */}
            {connected && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={disconnectWallet}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                    style={{
                      backgroundColor: `${theme.primary}20`,
                      color: theme.primary,
                    }}
                  >
                    <Wallet className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>
                {currentNetwork !== "0x61" && (
                  <button
                    onClick={() => switchNetwork("0x61")}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.background,
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 16L16 12L12 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 12H16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Switch to BSC Testnet
                  </button>
                )}
              </div>
            )}

            {/* Wallet Info */}
            {connected && (
              <div className="mb-4 p-3 bg-white/50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">
                    Connected Wallet
                  </span>
                  <span className="text-xs font-mono text-gray-800">
                    {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">USDT Balance</span>
                  <span className="text-xs font-medium text-gray-800">
                    {balance !== null ? balance.toFixed(2) : "0.00"} USDT
                  </span>
                </div>
              </div>
            )}
            {/* Payment Button */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount in USDT</span>
              <span className="font-bold text-gray-900">
                {(parseFloat(total) * 0.27).toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Payment Button */}
          {!connected ? (
            <button
              onClick={async () => {
                if (currentNetwork && currentNetwork !== "0x61") {
                  await switchNetwork("0x61");
                }
                await connectWallet();
              }}
              className="w-full p-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
              style={{
                color: theme.background,
                backgroundColor: theme.primary,
              }}
            >
              {currentNetwork && currentNetwork !== "0x61"
                ? "Switch to BSC Testnet & Connect"
                : "Connect Metamask"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={
                isProcessing ||
                !connected ||
                currentNetwork !== "0x61" ||
                (balance || 0) < parseFloat(total) * 0.27
              }
              className="w-full p-2  rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
              style={{
                color: theme.background,
                backgroundColor: theme.primary,
              }}
            >
              {isProcessing
                ? "Processing..."
                : (balance || 0) < parseFloat(total) * 0.27
                ? "Insufficient USDT Balance"
                : `Pay ${(parseFloat(total) * 0.27).toFixed(2)} USDT`}
            </button>
          )}
        </div>
      )}
      {selectedPaymentMethod === "cash" && (
        <div className="mt-3 space-y-4">
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            {/* Payment Button */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount to Pay</span>
              <span className="font-bold text-gray-900">
                {parseFloat(total).toFixed(2)} AED
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full p-2  rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
            style={{
              color: theme.background,
              backgroundColor: theme.primary,
            }}
          >
            Confirm order
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Card Payment Submit Button */}
      {selectedPaymentMethod === "card" && (
        <form onSubmit={handleSubmit} className="mt-3">
          <button
            type="submit"
            disabled={!stripe || !cardComplete || !clientSecret || isProcessing}
            className="w-full p-2.5  rounded-lg hover:bg-primary-600 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm"
            style={{
              color: theme.background,
              backgroundColor: theme.primary,
            }}
          >
            <Wallet className="w-3.5 h-3.5" />
            {isProcessing ? "Processing..." : `Pay ${total} AED & Place Order`}
          </button>
        </form>
      )}

      {/* Security Notice */}
      <p
        className="text-[10px] text-center"
        style={{
          color: theme.text,
        }}
      >
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
  const { state: restaurantState } = useRestaurant();
  const { orderDetails, paymentMethod } = state.checkout;

  if (!paymentMethod) {
    dispatch({ type: "SET_PAYMENT_METHOD", payload: "card" });
  }

  const total = state.cart
    .reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
    .toFixed(2);

  const selectedRestaurant = restaurantState.restaurants.find(
    (restaurant) => restaurant.id === restaurantState.activeRestroId
  );

  let stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    selectedRestaurant?.stripeAccountId
      ? { stripeAccount: selectedRestaurant.stripeAccountId }
      : undefined
  );

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
