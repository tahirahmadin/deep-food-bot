import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useChatLogic } from "./chat/ChatLogic";
import { useImageHandler } from "./chat/ImageHandler";
import { useCheckoutHandler } from "./chat/CheckoutHandler";
import { Header } from "./Header";
import { useToast } from "../context/ToastContext";
import { Toast } from "./Toast";
import { Filters } from "./Filters";
import { ChatPanel } from "./ChatPanel";
import { SlidePanel } from "./SlidePanel";
import { CartSummary } from "./CartSummary";
import { QueryType, useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";
import { getThemeForStyle } from "../utils/themeUtils";

export const DunkinOrderApp: React.FC = () => {
  const { toast, hideToast } = useToast();
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setRestaurants } = useRestaurant();
  const { isAuthenticated, setIsAddressModalOpen, addresses, orders } =
    useAuth();
  const { selectedStyle, isVegOnly, isFastDelivery, numberOfPeople } =
    useFiltersContext();
  const [input, setInput] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);

  // Reset UI state when auth changes.
  useEffect(() => {
    if (!isAuthenticated) {
      setInput("");
      setIsPanelOpen(false);
      setIsCartOpen(false);
    }
  }, [isAuthenticated]);

  // Instantiate our modular hooks.
  const chatLogic = useChatLogic({
    input,
    restaurantState,
    state,
    dispatch,
    orders,
    selectedStyle,
    isVegOnly,
    numberOfPeople,
    setRestaurants,
    addresses,
  });

  const imageHandler = useImageHandler({
    state,
    dispatch,
    restaurantState,
    selectedStyle,
    isVegOnly,
    numberOfPeople,
    orders,
    setRestaurants,
    getMenuItemsByFile: chatLogic.getMenuItemsByFile,
    handleMenuQuery: chatLogic.handleMenuQuery,
  });

  const checkoutHandler = useCheckoutHandler({
    state,
    dispatch,
    input,
    setInput,
  });

  // Helper: Get current time string once per handler.
  const getCurrentTime = () =>
    new Date().toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

  // Memoize handlers to avoid unnecessary re-creations.
  const handleImageUploadWrapper = useCallback(
    async (file: File) => {
      await imageHandler.handleImageUpload(file, setIsImageAnalyzing);
    },
    [imageHandler]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      // If in checkout mode, process checkout flow.
      if (state.checkout.step) {
        dispatch({ type: "SET_MODE", payload: "chat" });
        checkoutHandler.handleCheckoutFlow();
        return;
      }

      const queryType = chatLogic.determineQueryType(
        trimmedInput,
        restaurantState.activeRestroId
      );
      const userMessage = {
        id: Date.now(),
        text: trimmedInput,
        isBot: false,
        time: getCurrentTime(),
        queryType,
      };

      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_QUERY_TYPE", payload: queryType });
      setInput("");
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        await chatLogic.handleMenuQuery(queryType, trimmedInput);
      } catch (error) {
        console.error("Error processing AI response:", error);
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: "Sorry, I had trouble understanding your question. Please try again.",
            isBot: true,
            time: getCurrentTime(),
            queryType: QueryType.GENERAL,
          },
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [
      input,
      state,
      dispatch,
      checkoutHandler,
      chatLogic,
      restaurantState.activeRestroId,
    ]
  );

  const getInputPlaceholder = useCallback(() => {
    switch (state.currentQueryType) {
      case QueryType.MENU_QUERY:
        return "Ask about menu items or place an order...";
      case QueryType.RESTAURANT_QUERY:
        return "Ask about restaurants...";
      default:
        return "How can I help you today?";
    }
  }, [state.currentQueryType]);

  const { theme } = useFiltersContext();

  return (
    <div
      className="min-h-[100vh] h-[100vh] relative flex items-center justify-center  overflow-hidden"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <div
        className="relative w-full h-full max-w-md transition-all duration-300"
        style={{
          backgroundColor: theme.background || "#0B0E11",
          color: theme.text,
        }}
      >
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        <div className="fixed top-0 left-0 right-0 z-[50] max-w-md mx-auto">
          <Header
            onOpenPanel={() => setIsPanelOpen(true)}
            onCartClick={() => setIsCartOpen(!isCartOpen)}
          />
          <Filters />
        </div>
        <div className="h-full pt-[160px] pb-15">
          <ChatPanel
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            placeholder={getInputPlaceholder()}
            onImageUpload={handleImageUploadWrapper}
            isImageAnalyzing={isImageAnalyzing}
            isLoading={state.isLoading}
            queryType={state.currentQueryType}
          />
        </div>
        <CartSummary />
      </div>
      <SlidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 bg-orange-50 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {state.cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      ${item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_CART_ITEM",
                          payload: {
                            ...item,
                            quantity: Math.max(0, item.quantity - 1),
                          },
                        })
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_CART_ITEM",
                          payload: { ...item, quantity: item.quantity + 1 },
                        })
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {state.cart.length > 0 ? (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">
                    $
                    {state.cart
                      .reduce(
                        (total, item) =>
                          total + parseFloat(item.price) * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (addresses.length > 0) {
                      dispatch({
                        type: "UPDATE_ORDER_DETAILS",
                        payload: {
                          name: addresses[0].name,
                          address: addresses[0].address,
                          phone: addresses[0].mobile,
                        },
                      });
                      dispatch({
                        type: "SET_CHECKOUT_STEP",
                        payload: "payment",
                      });
                    } else {
                      setIsAddressModalOpen(true);
                    }
                  }}
                  className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Your cart is empty
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
