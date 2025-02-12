import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Menu,
  X,
  Store,
  Leaf,
  Zap,
  MapPin,
  ChevronDown,
  Plus,
  Home,
  Minus,
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";

export const Filters: React.FC = () => {
  const {
    isVegOnly,
    setIsVegOnly,
    isFastDelivery,
    setIsFastDelivery,
    numberOfPeople,
    setNumberOfPeople,
    selectedStyle,
    setSelectedStyle,
  } = useFiltersContext();

  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();
  const {
    addresses,
    isAuthenticated,
    isAddressModalOpen,
    setIsAddressModalOpen,
  } = useAuth();
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const { setAddresses } = useAuth();

  // Set initial selected address to first address if available
  useEffect(() => {
    if (addresses.length > 0 && selectedAddressIndex === null) {
      setSelectedAddressIndex(0);
    }
  }, [addresses]);

  const handleAddressSelect = async (index: number) => {
    if (index === selectedAddressIndex) return;

    // Move selected address to the front of the array
    const newAddresses = [...addresses];
    const [selectedAddress] = newAddresses.splice(index, 1);
    newAddresses.unshift(selectedAddress);

    // Update addresses in backend and state
    const success = await setAddresses(newAddresses);
    if (success) {
      setSelectedAddressIndex(0);
      setIsAddressDropdownOpen(false);
    }
  };

  const conversationStyles = [
    {
      name: "Gobbl",
      image:
        "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp",
    },
    {
      name: "Trump",
      image:
        "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop",
    },
    {
      name: "Godden Ramsay",
      image:
        "https://img.delicious.com.au/D-EUAdrh/w759-h506-cfill/del/2017/06/gordon-ramsay-47340-2.jpg",
    },
  ];

  const handleClearRestaurant = () => {
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: null });
    setActiveRestaurant(null);
  };

  return (
    <div className="px-4 py-1 bg-white border-b border-gray-100">
      {/* Home Address Section */}
      <div className="relative w-full flex justify-between items-center mb-1">
        <div className="relative flex-1 max-w-[70%]">
          <button
            onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
            className="flex items-center gap-1 hover:bg-gray-50 p-1 rounded-lg transition-colors w-full max-w-full"
            disabled={!isAuthenticated}
          >
            <MapPin className="w-3.5 h-3.5 text-gray-600" />
            <div className="text-[10px] text-gray-900 font-medium truncate max-w-[200px]">
              <span className="font-bold">
                {isAuthenticated
                  ? addresses[selectedAddressIndex]?.type || ""
                  : ""}{" "}
              </span>
              -{" "}
              {isAuthenticated
                ? addresses[selectedAddressIndex]?.address ||
                  "Add delivery address"
                : "Sign in to add address..."}
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Address Dropdown */}
          {isAddressDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              {addresses.map((addr, index) => (
                <button
                  key={index}
                  onClick={() => handleAddressSelect(index)}
                  className={`flex items-start gap-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors ${
                    selectedAddressIndex === index ? "bg-orange-50" : ""
                  }`}
                >
                  <Home className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-900 line-clamp-1">
                      {addr.name}
                    </p>
                    <p className="text-[10px] text-gray-500 line-clamp-1 max-w-[180px]">
                      {addr.address}
                    </p>
                    <p className="text-[9px] text-gray-400">{addr.type}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  setIsAddressModalOpen(true);
                  setIsAddressDropdownOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-primary hover:bg-gray-50 transition-colors border-t"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Add New Address</span>
              </button>
            </div>
          )}
        </div>

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

      {/* Filters Section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-600">For</span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
            <button
              onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded-full text-gray-600"
            >
              <Minus className="w-3 h-3" />
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
              <Plus className="w-3 h-3" />
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
            !restaurantState.activeRestroId
              ? "text-primary"
              : "text-gray-100 px-2 py-0.5 bg-blue-600 rounded-full"
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
