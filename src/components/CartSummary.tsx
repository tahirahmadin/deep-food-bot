import React from "react";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";

export const CartSummary: React.FC = () => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { isAuthenticated, addresses, setIsAddressModalOpen } = useAuth();
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [menuItems, setMenuItems] = React.useState<any[]>([]);
  const { theme } = useFiltersContext();

  const { dispatch: restaurantDispatch } = useRestaurant();

  React.useEffect(() => {
    const fetchMenuItems = async () => {
      if (
        restaurantState.activeRestroId &&
        !restaurantState.menus[restaurantState.activeRestroId]
      ) {
        const items = await getMenuByRestaurantId(
          restaurantState.activeRestroId,
          restaurantState,
          restaurantDispatch
        );
        setMenuItems(
          restaurantState.menus[restaurantState.activeRestroId] || []
        );
      }
    };
    fetchMenuItems();
  }, [restaurantState.activeRestroId, restaurantState, restaurantDispatch]);

  const cartTotal = React.useMemo(() => {
    return state.cart
      .reduce((total, item) => {
        return total + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);
  }, [state.cart]);

  const updateQuantity = (
    itemId: number,
    name: string,
    price: string,
    change: number
  ) => {
    const item = state.cart.find((i) => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
      } else {
        dispatch({
          type: "UPDATE_CART_ITEM",
          payload: { id: itemId, name, price, quantity: newQuantity },
        });
      }
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsExpanded(false);
      return;
    }

    if (state.cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (addresses.length === 0) {
      alert("Please add a delivery address first");
      setIsExpanded(false);
      setIsAddressModalOpen(true);
      return;
    }

    if (state.mode === "browse") {
      dispatch({ type: "SET_MODE", payload: "chat" });
    }

    // Set default payment method to card
    dispatch({ type: "SET_PAYMENT_METHOD", payload: "card" });
    setIsExpanded(false);
    // Add order details message with summary card
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now() + 1,
        text: JSON.stringify({
          orderSummary: {
            items: state.cart.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total: cartTotal,
            restaurant: state.selectedRestaurant,
          },
        }),
        isBot: true,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: "CHECKOUT",
      },
    });
    dispatch({
      type: "UPDATE_ORDER_DETAILS",
      payload: {
        name: addresses[0].name,
        address: addresses[0].address,
        phone: addresses[0].mobile,
      },
    });
  };

  if (state.cart.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-2">
      <div className="flex flex-col items-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2 py-2 text-white rounded-full transition-all shadow-lg mb-2"
          style={{
            backgroundColor: theme.primary,
            color: theme.background,
          }}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="font-medium text-xs">{cartTotal} AED</span>
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              color: theme.primary,
              backgroundColor: theme.background,
            }}
          >
            {state.cart.length}
          </span>
        </button>

        {isExpanded && (
          <div
            className=" rounded-lg shadow-xl w-full overflow-hidden animate-slide-up"
            style={{ backgroundColor: theme.modalBg }}
          >
            <div
              className="px-4 py-2 flex justify-between items-center border-b p-3 border-b"
              style={{ backgroundColor: theme.modalBgLight }}
            >
              <h3
                className="font-semibold "
                style={{ color: theme.modalSecondText }}
              >
                Your Cart
              </h3>
              <X
                style={{ color: theme.modalSecondText }}
                className="w-4 h-4 text-gray-500"
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {state.cart.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 border-b"
                  >
                    <img
                      src={`${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${
                        restaurantState.activeRestroId
                      }/${restaurantState.activeRestroId}-${item.id}.jpg`}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-medium text-xs truncate"
                        style={{
                          color: theme.modalMainText,
                        }}
                      >
                        {item.name}
                        <div className="mt-0.5">
                          {item.customizations?.map((customization, index) => (
                            <div
                              key={index}
                              className="text-[10px] text-gray-500"
                            >
                              <span className="font-semibold text-gray-500">
                                {customization.categoryName}:
                              </span>{" "}
                              {customization.selection.name}
                              {customization.selection.price > 0 && (
                                <span
                                  className="ml-1 opacity-80"
                                  style={{
                                    color: theme.modalMainText,
                                  }}
                                >
                                  (+{customization.selection.price} AED)
                                </span>
                              )}
                            </div>
                          ))}
                          {/* Render the Edit button if customizations exist */}
                          {item.customizations &&
                            item.customizations.length > 0 && (
                              <button
                                onClick={() =>
                                  dispatch({
                                    type: "SET_CUSTOMIZATION_MODAL",
                                    payload: {
                                      isOpen: true,
                                      item,
                                      isEditing: true,
                                    },
                                  })
                                }
                                className="text-grey-400 font-bold text-xs mt-1"
                              >
                                Edit ▶
                              </button>
                            )}
                        </div>
                      </h4>
                      <p
                        className="text-xs opacity-70"
                        style={{
                          color: theme.modalMainText,
                        }}
                      >
                        {item.price} AED
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.name, item.price, -1)
                        }
                        className={`p-1  rounded-full`}
                        style={{
                          backgroundColor: theme.modalBg,
                          ":hover": { backgroundColor: theme.modalBgLight },
                        }}
                      >
                        <Minus
                          className="w-4 h-4"
                          style={{ color: theme.chatBubbleBg }}
                        />
                      </button>
                      <span
                        className="text-sm font-medium w-6 text-center"
                        style={{ color: theme.modalMainText }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.name, item.price, 1)
                        }
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Plus
                          className="w-4 h-4"
                          style={{ color: theme.chatBubbleBg }}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="p-4  border-t"
              style={{
                backgroundColor: theme.modalBg,
                color: theme.modalMainText,
              }}
            >
              <div className="flex justify-between mb-4">
                <span className="font-medium ">Total</span>
                <span className="font-bold ">{cartTotal} AED</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-2 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme.chatBubbleBg,
                  color: theme.chatBubbleText,
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
