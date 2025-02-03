import React from "react";
import {
  MessageSquare,
  Menu,
  X,
  Globe,
  Store,
  Users,
  Leaf,
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";

interface FiltersProps {
  isVegOnly: boolean;
  setIsVegOnly: (value: boolean) => void;
  numberOfPeople: number;
  setNumberOfPeople: (value: number) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  isVegOnly,
  setIsVegOnly,
  numberOfPeople,
  setNumberOfPeople,
}) => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();

  const handleClearRestaurant = () => {
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: null });
    setActiveRestaurant(null);
  };

  return (
    <div className="px-2 py-1 bg-white/50 backdrop-blur-sm border-b border-white/20">
      <div className="flex items-center justify-between">
        {/* Left Section: People Counter */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1">
            <button
              onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
              className="px-0.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            >
              -
            </button>
            <div className="flex items-center gap-1 px-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-gray-700">
                {numberOfPeople}
              </span>
            </div>
            <button
              onClick={() => setNumberOfPeople(numberOfPeople + 1)}
              className="px-0.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={() => setIsVegOnly(!isVegOnly)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors group ${
              isVegOnly ? "bg-green-500" : "bg-gray-400"
            }`}
            title="Toggle Veg Only"
          >
            <Leaf
              className={`absolute left-1 w-3 h-3 transition-opacity ${
                isVegOnly ? "text-white opacity-100" : "opacity-0"
              }`}
            />
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isVegOnly ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Center Section: Mode Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "chat" })}
            className={`flex items-center p-1.5 rounded transition-colors text-xs ${
              state.mode === "chat"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            title="Chat Mode"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => dispatch({ type: "SET_MODE", payload: "browse" })}
            className={`flex items-center p-1.5 rounded transition-colors text-xs ${
              state.mode === "browse"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
            title="Browse Mode"
          >
            <Menu className="w-3.5 h-3.5" />
            Menu
          </button>
        </div>

        {/* Right Section: Veg Toggle and Restaurant Selection */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all ${
              state.selectedRestaurant
                ? "bg-primary/10 text-primary"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {state.selectedRestaurant ? (
              <Store className="w-3.5 h-3.5" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span className="font-medium max-w-[80px] truncate">
              {state.selectedRestaurant || "All"}
            </span>
            {state.selectedRestaurant && (
              <button
                onClick={handleClearRestaurant}
                className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
