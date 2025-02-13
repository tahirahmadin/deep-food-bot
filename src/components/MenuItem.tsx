import React from "react";
import { Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { CartChangeModal } from "./CartChangeModal";

interface MenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  quantity: number;
  restaurant?: string;
  compact?: boolean;
  isCustomisable?: boolean;
  customisation?: {
    categories: {
      categoryName: string;
      minQuantity: number;
      maxQuantity: number;
      items: {
        name: string;
        price: number;
        _id: string;
      }[];
      _id: string;
    }[];
    _id: string;
  };
}

export const MenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  price,
  restaurant = "",
  image,
  quantity,
  compact = false,
  isCustomisable = false,
  customisation,
}) => {
  const { state, dispatch } = useChatContext();
  const { isAuthenticated } = useAuth();

  const [isCustomizationOpen, setIsCustomizationOpen] = React.useState(false);
  const [isCartChangeModalOpen, setIsCartChangeModalOpen] =
    React.useState(false);

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      alert("Please sign in to add items to cart");
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
            restaurant,
          },
        },
      });
      return;
    }

    // Check if cart has items from a different restaurant
    const cartRestaurant = state.cart[0]?.restaurant;

    // If cart is not empty and has items from a different restaurant
    if (cartRestaurant && cartRestaurant !== restaurant) {
      setIsCartChangeModalOpen(true);
      return;
    }

    // Add item to cart
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1, restaurant },
    });
  };

  const handleCartChange = () => {
    // Clear cart and add new item
    dispatch({ type: "CLEAR_CART" });
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1, restaurant },
    });
    setIsCartChangeModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsCartChangeModalOpen(false);
  };

  return (
    <>
      <div className="bg-[#F9FAFB] rounded-lg shadow-sm overflow-hidden flex flex-col w-[95px]">
        <div className="w-full relative">
          <img
            src={image || "https://via.placeholder.com/100"}
            alt={name}
            className="w-full h-[60px] object-cover"
          />
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-1 right-1 p-1 rounded-full transition-all ${
              !isAuthenticated ? "opacity-50" : ""
            } ${
              isInCart
                ? "bg-primary text-white hover:bg-primary-600 shadow-sm"
                : "bg-white text-primary hover:bg-primary-50"
            }`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-1 flex flex-col">
          <h3 className="text-[9px] font-medium text-gray-800 line-clamp-2 min-h-[2rem]">
            {name}
          </h3>
          <p className="text-primary font-bold text-[10px]">{price} AED</p>
        </div>
      </div>
      <CartChangeModal
        isOpen={isCartChangeModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleCartChange}
        currentRestaurant={state.cart[0]?.restaurant || ""}
        newRestaurant={restaurant}
      />
    </>
  );
};
