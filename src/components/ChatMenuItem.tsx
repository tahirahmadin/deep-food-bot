import React from "react";
import { Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

interface ChatMenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  quantity: number;
}

export const ChatMenuItem: React.FC<ChatMenuItemProps> = ({
  id,
  name,
  price,
  image,
  quantity,
}) => {
  const { state, dispatch } = useChatContext();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1 },
    });
  };

  return (
    <div className="bg-[#F9FAFB] rounded-lg shadow-sm overflow-hidden flex flex-col w-[85px]">
      {/* Image Container */}
      <div className=" w-full relative">
        <img
          src={image || "https://via.placeholder.com/100"}
          alt={name}
          className="w-full h-[70px] object-cover"
        />
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-1 right-1 p-1 rounded-full transition-all ${
            isInCart
              ? "bg-primary text-white hover:bg-primary-600 shadow-sm"
              : "bg-white text-primary hover:bg-primary-50"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Container */}
      <div className="p-1.5 flex flex-col">
        <h3 className="text-[10px] font-medium text-gray-800 line-clamp-2 min-h-[2rem]">
          {name}
        </h3>
        <p className="text-primary font-bold text-[10px] mt-0.5">{price} AED</p>
      </div>
    </div>
  );
};
