import React from "react";
import { Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { CustomizationModal } from "./CustumizationModal";
import { MenuItemFront } from "../types/menu";

interface MenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  restaurant?: string;
  isCustomisable?: boolean;
  customisation?: MenuItemFront["customisation"];
}

export const ChatMenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  price,
  restaurant = "",
  image,
  isCustomisable = false,
  customisation,
}) => {
  const { state, dispatch } = useChatContext();

  const [isCustomizationOpen, setIsCustomizationOpen] = React.useState(false);

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  const handleAddToCart = () => {
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
            restaurant,
          },
        },
      });
      return;
    }

    // Check if cart has items from a different restaurant
    const cartRestaurant = state.cart[0]?.restaurant;

    if (cartRestaurant && cartRestaurant !== restaurant) {
      if (
        window.confirm(
          `Your cart contains items from ${cartRestaurant}. Would you like to clear your cart and add items from ${restaurant} instead?`
        )
      ) {
        dispatch({ type: "CLEAR_CART" });
        dispatch({
          type: "ADD_TO_CART",
          payload: { id, name, price, quantity: 1, restaurant },
        });
      }
      return;
    }

    // Add item to cart
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1, restaurant },
    });
  };

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
        <h3 className="text-[9px] font-medium text-gray-800 line-clamp-3 min-h-[2rem]">
          {name}
        </h3>
        <p className="text-primary font-bold text-[9px]">{price} AED</p>
      </div>
    </div>
  );
};
