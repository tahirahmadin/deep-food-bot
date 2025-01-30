import React from "react";
import { X, Plus, Minus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";

interface MenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  quantity: number;
  compact?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  id,
  name,
  price,
  image,
  quantity,
  compact = false,
}) => {
  const { state, dispatch } = useChatContext();

  // Check if item is in cart
  const cartItem = state.cart.find((item) => item.id === id);
  const isInCart = Boolean(cartItem);

  const handleRemove = () => {
    dispatch({ type: "REMOVE_FROM_CART", payload: id });
  };

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_TO_CART",
      payload: { id, name, price, quantity: 1 },
    });
  };
  return (
    <div
      className={`bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        compact ? "p-1.5 h-[150px]" : "p-0.5 h-[160px]"
      }`}
    >
      <div className="relative h-full">
        <div
          className={`aspect-[4/3] w-full flex items-center justify-center rounded-xl bg-gray-50 ${
            compact ? "p-0.5" : "p-1"
          }`}
        >
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover rounded-xl ${
              compact ? "p-1" : "p-1"
            }`}
          />
        </div>
        <h3
          className={`font-medium text-gray-800 ${
            compact ? "text-[12px] pl-0.5" : "text-xs pl-1"
          } line-clamp-2 overflow-hidden`}
          style={{
            height: compact ? "2.4em" : "3em", // Adjust height based on font size
            lineHeight: compact ? "1.2em" : "1.5em", // Adjust line height based on font size
          }}
        >
          {name}
        </h3>
        <div
          className={`flex items-center justify-between ${
            compact ? "mt-1 pl-0.5" : "mt-1 pl-1"
          }`}
        >
          <p
            className={`text-orange-500 font-bold ${
              compact ? "text-[10px]" : "text-xs"
            }`}
          >
            {price} AED
          </p>
          <div>
            <button
              onClick={handleAddToCart}
              className={`${
                compact ? "p-0.5" : "p-1.5"
              } flex items-center justify-center rounded-full transition-all ${
                isInCart
                  ? "bg-primary text-white hover:bg-primary-600 shadow-sm"
                  : "bg-primary-50 text-primary-600 hover:bg-primary-100"
              }`}
            >
              <Plus className={compact ? "w-3.5 h-3.5" : "w-3.5 h-3.5"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
