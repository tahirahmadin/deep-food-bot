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
  const { user } = useAuth();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<
    Array<{ name: string; address: string; mobile: string }>
  >([]);
  const [selectedAddress, setSelectedAddress] = useState<number>(0);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user?.userId) {
        const response = await getUserDetails(user.userId);
        if (!response.error && response.result?.addresses) {
          setAddresses(response.result.addresses);
        }
      }
    };
    fetchUserDetails();
  }, [user?.userId]);

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
        setSelectedAddress(updatedAddresses.length - 1);
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
            {addresses[selectedAddress]?.address || "Add delivery address..."}
          </div>
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Agent A (Right Side) */}
        <div className="flex items-center gap-1 text-xs">
          <span>OpenAI</span>
          <ChevronDown className="w-3 h-3" />
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
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded-full text-gray-600"
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

          <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-gray-600">
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
