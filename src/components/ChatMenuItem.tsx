import React from "react";
import { Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { CartChangeModal } from "./CartChangeModal";
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
  const [isCartChangeModalOpen, setIsCartChangeModalOpen] =
    React.useState(false);
  const [restaurantName, setRestaurantName] = React.useState("");

  // Check if item is in cart
  const cartItem = state.cart.find((item) => {
    // console.log(item);
    return item.id === id && restaurantName === state.cart[0]?.restaurant;
  });
  const isInCart = Boolean(cartItem);

  // Get and set restaurant name when component mounts or restroId changes
  React.useEffect(() => {
    const name = menuUtils.getRestaurantNameById(
      restaurantState.restaurants,
      restroId
    );
    setRestaurantName(name);
  }, [restroId, restaurantState.restaurants]);

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
    // Check if cart has items from a different restaurant
    const cartRestaurant = state.cart[0]?.restaurant;

    console.log(cartRestaurant);
    console.log(restaurantName);
    // If cart is not empty and has items from a different restaurant
    if (cartRestaurant && cartRestaurant !== restaurantName) {
      setIsCartChangeModalOpen(true);
      return;
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

  const handleCartChange = () => {
    dispatch({ type: "CLEAR_CART" });
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: restaurantName });
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1, restaurant: restaurantName },
    });
    handleSelectRestro(restroId);
    setIsCartChangeModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsCartChangeModalOpen(false);
  };
  return (
    <>
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
      <CartChangeModal
        isOpen={isCartChangeModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleCartChange}
        currentRestaurant={state.cart[0]?.restaurant || ""}
        newRestaurant={restaurantName}
      />
    </>
  );
};
