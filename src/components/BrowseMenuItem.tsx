import React from "react";
import { Minus, Plus } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useFiltersContext } from "../context/FiltersContext";

interface BrowseMenuItemProps {
  name: string;
  price: string;
  id: number;
  image: string;
  quantity: number;
  compact?: boolean;
}

export const BrowseMenuItem: React.FC<BrowseMenuItemProps> = ({
  id,
  name,
  price,
  image,
  quantity,
  compact = false,
}) => {
  const { state, dispatch } = useChatContext();
  const { theme } = useFiltersContext();

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
    <div
      className={` rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-1.5 h-[150px] `}
      style={{
        backgroundColor: theme.background,
      }}
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
            height: compact ? "2.4em" : "3em",
            lineHeight: compact ? "1.2em" : "1.5em",
          }}
        >
          {name}
        </h3>
        <div
          className="text-[9px] font-medium text-gray-800 line-clamp-2 min-h-[1.5rem]"
          style={{
            color: theme.text,
          }}
        >
          <p className="font-bold text-[8px]" style={{ color: theme.primary }}>
            {price} AED
          </p>
          <div>
            <button
              onClick={handleAddToCart}
              className={`absolute bottom-1 right-1 p-1 rounded-full transition-all `}
              style={{
                backgroundColor: isInCart ? theme.headerBg : theme.primary,
                color: isInCart ? theme.primary : theme.headerBg,
              }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
