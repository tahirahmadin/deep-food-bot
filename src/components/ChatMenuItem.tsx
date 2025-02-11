import React from "react";
import { Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import * as menuUtils from "../utils/menuUtils";

import { MenuItemFront } from "../types/menu";

interface MenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  restroId: number;
  restaurant?: string;
  isCustomisable?: boolean;
  customisation?: MenuItemFront["customisation"];
}

export const ChatMenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  price,
  restroId,
  restaurant,
  image,
  isCustomisable = false,
  customisation,
}) => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  // Get restaurant name from restaurant state
  const getRestaurantName = () => {
    const restaurant = restaurantState.restaurants.find(
      (r) => r.id === restroId
    );
    return restaurant?.name || "Unknown Restaurant";
  };

  const handleSelectRestro = (restroId: number) => {
    // If clicking on already active restaurant, clear selection
    if (restaurantState.activeRestroId === restroId) {
    } else {
      setActiveRestaurant(restroId);
      const restaurantName = menuUtils.getRestaurantNameById(
        restaurantState.restaurants,
        restroId
      );
      if (restaurantName !== "Unknown Restaurant") {
        dispatch({
          type: "SET_SELECTED_RESTAURANT",
          payload: restaurantName,
        });
      }
    }
  };

  const handleAddToCart = () => {
    const restaurantName = menuUtils.getRestaurantNameById(
      restaurantState.restaurants,
      restroId
    );

    // Check if cart has items from a different restaurant
    const cartRestaurant = state.cart[0]?.restaurant;

    // If cart is not empty and has items from a different restaurant
    if (cartRestaurant && cartRestaurant !== restaurantName) {
      if (
        window.confirm(
          `Your cart contains items from ${cartRestaurant}. Would you like to clear your cart and add items from ${restaurantName} instead?`
        )
      ) {
        dispatch({ type: "CLEAR_CART" });
        // Update selected restaurant
        dispatch({ type: "SET_SELECTED_RESTAURANT", payload: restaurantName });
        // Then proceed with adding the new item
      } else {
        // User declined to clear cart, so don't add the item
        return;
      }
    }

    if (isCustomisable && customisation) {
      dispatch({
        type: "SET_CUSTOMIZATION_MODAL",
        payload: {
          isOpen: true,
          item: {
            id,
            name,
            price,
            image,
            customisation,
            restaurant: restaurantName,
          },
        },
      });
      return;
    }

    // Add item to cart
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1, restaurant: restaurantName },
    });
    handleSelectRestro(restroId);
  };

  console.log("restaurantName");
  console.log(state.selectedRestaurant);
  console.log(restaurantState.activeRestroId);
  return (
    <div className="bg-[#F9FAFB] rounded-lg shadow-sm overflow-hidden flex flex-col w-[80px]">
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
        <h3 className="text-[9px] font-medium text-gray-800 line-clamp-2 min-h-[1.5rem]">
          {name}
        </h3>
        <p className="text-primary font-bold text-[8px]">{price} AED</p>
      </div>
    </div>
  );
};
