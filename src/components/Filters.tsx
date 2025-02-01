import React from "react";
import { MessageSquare, Menu, X, Globe, Store } from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";

interface FiltersProps {
  isVegOnly: boolean;
  setIsVegOnly: (value: boolean) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  isVegOnly,
  setIsVegOnly,
}) => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();

  const handleClearRestaurant = () => {
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: null });
    setActiveRestaurant(null);
  };

  return (
    <div className="px-3 bg-white/50 backdrop-blur-sm border-b border-white/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVegOnly(!isVegOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isVegOnly ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isVegOnly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Veg</span>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "chat" })}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              state.mode === "chat"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "browse" })}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              state.mode === "browse"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Menu className="w-4 h-4" />
            Browse
          </button>
        </div>
      </div>

      <div className="relative flex items-center">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            state.selectedRestaurant
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {state.selectedRestaurant ? (
            <Store className="w-4 h-4" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {state.selectedRestaurant || "All Restaurants"}
          </span>
          {state.selectedRestaurant && (
            <button
              onClick={handleClearRestaurant}
              className="p-1 hover:bg-primary/20 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
