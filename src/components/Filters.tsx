import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Menu,
  X,
  Globe,
  Store,
  Users,
  Leaf,
  Zap,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { getUserDetails, updateUserAddresses } from "../actions/serverActions";
import { AddressModal } from "./AddressModal";

interface FiltersProps {
  isVegOnly: boolean;
  setIsVegOnly: (value: boolean) => void;
  isFastDelivery: boolean;
  setIsFastDelivery: (value: boolean) => void;
  numberOfPeople: number;
  setNumberOfPeople: (value: number) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  isVegOnly,
  setIsVegOnly,
  isFastDelivery,
  setIsFastDelivery,
  numberOfPeople,
  setNumberOfPeople,
}) => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();
  const { user } = useAuth();
  const { addresses, setAddresses } = useAuth();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState({
    name: "Trump",
    image:
      "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop",
  });

  const conversationStyles = [
    {
      name: "Trump",
      image:
        "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop",
    },
    {
      name: "Modi",
      image:
        "https://www.thestatesman.com/wp-content/uploads/2022/09/03_Merged.jpg",
    },
    {
      name: "SRK",
      image:
        "https://kalingatv.com/wp-content/uploads/2020/11/shah-rukh-khan-turns-55.jpg",
    },
  ];

  const handleSaveAddress = async (newAddress: {
    name: string;
    address: string;
    mobile: string;
  }) => {
    if (user?.userId) {
      const updatedAddresses = [...addresses, newAddress];
      const response = await updateUserAddresses(user.userId, updatedAddresses);
      if (!response.error) {
        setAddresses(updatedAddresses);
        setSelectedAddressIndex(updatedAddresses.length - 1);
      }
    }
  };

  const handleClearRestaurant = () => {
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: null });
    setActiveRestaurant(null);
  };

  return (
    <div className="px-4 py-1 bg-white border-b border-gray-100">
      {/* Home Address Section */}
      <div className="w-full flex justify-between items-center mb-1">
        {/* Home and Address Button (Left Side) */}
        <button
          onClick={() => setIsAddressModalOpen(true)}
          className="flex justify-start items-center items-start gap-1 hover:bg-gray-50 p-1 rounded-lg transition-colors"
        >
          <MapPin className="w-4 h-4 text-gray-800" />
          <div className="text-[11px] font-bold text-gray-900">Home:</div>
          <div className="text-[10px] text-gray-600">
            {addresses[selectedAddressIndex]?.address ||
              "Add delivery address..."}
          </div>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Agent A (Right Side) */}
        <div className="relative">
          <button
            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
            className="flex items-center gap-2 text-xs hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
          >
            <img
              src={selectedStyle.image}
              alt={selectedStyle.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span>{selectedStyle.name}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isStyleDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-48 z-50">
              {conversationStyles.map((style) => (
                <button
                  key={style.name}
                  onClick={() => {
                    setSelectedStyle(style);
                    setIsStyleDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-sm">{style.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
      />

      {/* Filters Section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-600">For</span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
            <button
              onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded-full text-gray-600"
            >
              -
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-700">
                {numberOfPeople}
              </span>
            </div>
            <button
              onClick={() => setNumberOfPeople(numberOfPeople + 1)}
              className="w-4 h-3 flex items-center justify-center hover:bg-gray-200 rounded-full text-gray-600"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setIsVegOnly(!isVegOnly)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
              isVegOnly
                ? "bg-primary/10 border-primary text-primary"
                : "border-gray-200 text-gray-600"
            } transition-colors`}
          >
            <Leaf className="w-3 h-3" />
            <span className="text-xs">Veg</span>
          </button>

          <button
            onClick={() => setIsFastDelivery(!isFastDelivery)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
              isFastDelivery
                ? "bg-primary/10 border-primary text-primary"
                : "border-gray-200 text-gray-600"
            } transition-colors`}
          >
            <Zap className="w-3 h-3" />
            <span className="text-xs">Fast Delivery</span>
          </button>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex justify-between items-center gap-4 mt-2 border-t border-gray-100 pt-2">
        <button
          onClick={() => dispatch({ type: "SET_MODE", payload: "chat" })}
          className={`flex items-center gap-1 ${
            state.mode === "chat" ? "text-primary" : "text-gray-400"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">CHAT</span>
        </button>

        <button
          onClick={handleClearRestaurant}
          className={`flex items-center gap-1 ${
            !restaurantState.activeRestroId ? "text-primary" : "text-gray-400"
          }`}
        >
          <Store className="w-4 h-4" />
          <span className="text-sm">
            {restaurantState.activeRestroId
              ? state.selectedRestaurant
              : "All Restaurants"}
          </span>
          {restaurantState.activeRestroId && <X className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => dispatch({ type: "SET_MODE", payload: "browse" })}
          className={`flex items-center gap-1 ${
            state.mode === "browse" ? "text-primary" : "text-gray-400"
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-sm">BROWSE</span>
        </button>
      </div>
    </div>
  );
};
