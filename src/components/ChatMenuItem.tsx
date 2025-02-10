import React from "react";
import { Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import * as menuUtils from "../utils/menuUtils";

interface ChatMenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  quantity: number;
  restroId: number;
}

export const ChatMenuItem: React.FC<ChatMenuItemProps> = ({
  id,
  name,
  price,
  image,
  quantity,
  restroId,
}) => {
  const { state, dispatch } = useChatContext();
  const {
    state: restaurantState,
    setActiveRestaurant,
    setRestaurants,
  } = useRestaurant();
  const { dispatch: chatDispatch } = useChatContext();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  const handleAddToCart = () => {
    // Check if cart has items from a different restaurant
    const cartRestaurant = state.cart[0]?.restaurant;
    const currentRestaurant = menuUtils.getRestaurantNameById(
      restaurantState.restaurants,
      restroId
    );

    if (cartRestaurant && cartRestaurant !== currentRestaurant) {
      if (
        window.confirm(
          `Your cart contains items from ${cartRestaurant}. Would you like to clear your cart and add items from ${currentRestaurant} instead?`
        )
      ) {
        dispatch({ type: "CLEAR_CART" });
        dispatch({
          type: "ADD_TO_CART",
          payload: {
            id,
            name,
            price,
            quantity: 1,
            restaurant: currentRestaurant,
          },
        });
        handleSelectRestro(restroId);
      }
      return;
    }

    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1, restaurant: currentRestaurant },
    });
    handleSelectRestro(restroId);
  };

  const handleSelectRestro = (restroId: number) => {
    // If clicking on already active restaurant, clear selection
    if (restaurantState.activeRestroId === restroId) {
      // Clear active restaurant and selected restaurant name
      // Clear active restaurant only
      // setActiveRestaurant(null);
    } else {
      // Set new active restaurant and update selected restaurant name
      // Set new active restaurant only
      setActiveRestaurant(restroId);
      const restaurantName = menuUtils.getRestaurantNameById(
        restaurantState.restaurants,
        restroId
      );
      if (restaurantName !== "Unknown Restaurant") {
        chatDispatch({
          type: "SET_SELECTED_RESTAURANT",
          payload: restaurantName,
        });
      }
    }
  };

  return (
    <div className="bg-[#F9FAFB] rounded-lg shadow-sm overflow-hidden flex flex-col w-[80px]">
      {/* Image Container */}

      <div className=" w-full relative">
        <img
          src={image || "https://via.placeholder.com/100"}
          alt={name}
          className="w-full h-[55px] object-cover"
        />
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-1 right-1 p-1 rounded-full transition-all ${
            isInCart
              ? "bg-primary text-white hover:bg-primary-600 shadow-sm"
              : "bg-white text-primary hover:bg-primary-50"
          }`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Content Container */}
      <div className="p-1.5 flex flex-col">
        <h3 className="text-[9px] font-medium text-gray-800 line-clamp-3 min-h-[2rem]">
          {name}
        </h3>
        <p className="text-primary font-bold text-[9px]">{price} AED</p>
      </div>
    </div>
  );
};
