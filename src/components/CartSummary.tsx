import React from "react";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";
import { useAuth } from "../context/AuthContext";

export const CartSummary: React.FC = () => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { isAuthenticated } = useAuth();
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
      // Close cart and trigger sign in
      setIsExpanded(false);
      login();
      return;
    }

    if (state.cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Switch to chat mode if currently in browse mode
    if (state.mode === "browse") {
      dispatch({ type: "SET_MODE", payload: "chat" });
    }

    dispatch({ type: "SET_CHECKOUT_STEP", payload: "details" });
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: "Please provide your delivery details to proceed with the order.",
        isBot: true,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: "CHECKOUT",
      },
    });
    setIsExpanded(false);
  };

  if (state.cart.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-4 z-50">
      <div className="flex flex-col items-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-600 transition-all shadow-lg mb-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="font-medium">{cartTotal} AED</span>
          <span className="bg-white text-primary px-2 py-0.5 rounded-full text-sm">
            {state.cart.length}
          </span>
        </button>

        {isExpanded && (
          <div className="bg-white rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:w-80 overflow-hidden animate-slide-up">
            <div className="p-4 bg-orange-50 border-b">
              <h3 className="font-semibold text-gray-800">Your Cart</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {state.cart.map((item) => {
                const menuItem = menuItems.find(
                  (menuItem) => menuItem.id === item.id
                );
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border-b"
                  >
                    {menuItem && (
                      <img
                        src={menuItem.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-800 truncate">
                        {item.name}
                        <div className="mt-1">
                          {item.customizations?.map((customization, index) => (
                            <div key={index} className="text-xs text-gray-500">
                              <span className="font-medium">
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
                      <p className="text-sm text-gray-500">{item.price} AED</p>
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
