import React from "react";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";
import { useAuth } from "../context/AuthContext";

export const CartSummary: React.FC = () => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { isAuthenticated, addresses, setIsAddressModalOpen } = useAuth();
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [menuItems, setMenuItems] = React.useState<any[]>([]);

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
          className="flex items-center gap-2 px-2 py-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-all shadow-lg mb-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="font-medium text-xs">{cartTotal} AED</span>
          <span className="bg-white text-primary px-2 py-0.5 rounded-full text-xs">
            {state.cart.length}
          </span>
        </button>

        {isExpanded && (
          <div className="bg-white rounded-lg shadow-xl w-full overflow-hidden animate-slide-up">
            <div className="px-4 py-2 flex justify-between items-center border-b p-3 bg-orange-50 border-b">
              <h3 className="font-semibold text-gray-800">Your Cart</h3>
              <X
                className="w-4 h-4 text-gray-500"
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {state.cart.map((item) => {
                const menuItem = menuItems.find(
                  (menuItem) => menuItem.id === item.id
                );
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 border-b"
                  >
                    <img
                      src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurantState.activeRestroId}/${restaurantState.activeRestroId}-${item.id}.jpg`}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-gray-800 truncate">
                        {item.name}
                        <div className="mt-0.5">
                          {item.customizations?.map((customization, index) => (
                            <div
                              key={index}
                              className="text-[10px] text-gray-500"
                            >
                              <span className="font-semibold text-gray-800">
                                {customization.categoryName}:
                              </span>{" "}
                              {customization.selection.name}
                              {customization.selection.price > 0 && (
                                <span className="text-primary ml-1">
                                  (+{customization.selection.price} AED)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </h4>
                      <p className="text-xs text-gray-500">{item.price} AED</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.name, item.price, -1)
                        }
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.name, item.price, 1)
                        }
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-white border-t">
              <div className="flex justify-between mb-4">
                <span className="font-medium text-gray-800">Total</span>
                <span className="font-bold text-primary">{cartTotal} AED</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
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
