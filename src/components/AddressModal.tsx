import React, { useState } from "react";
import {
  X,
  Plus,
  Pencil,
  Search,
  MapPin,
  Home,
  Building2,
  Hotel,
  MoreVertical,
  Share2,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type AddressType = "home" | "office" | "hotel";

interface Address {
  name: string;
  address: string;
  landmark: string;
  mobile: string;
  type: AddressType;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { addresses } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressType, setAddressType] = useState<AddressType>("home");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<
    number | null
  >(null);

  const handleAddNewClick = () => {
    setShowForm(true);
    setEditingAddress(null);
    setSelectedAddressIndex(null);
    setName("");
    setAddress("");
    setLandmark("");
    setMobile("");
    setAddressType("home");
    setCoordinates(null);
  };

  const handleEditClick = (index: number) => {
    const addressToEdit = addresses[index];
    setSelectedAddressIndex(index);
    setName(addressToEdit.name);
    setAddress(addressToEdit.address);
    setLandmark(addressToEdit.landmark || "");
    setMobile(addressToEdit.mobile);
    setAddressType(addressToEdit.type || "home");
    setCoordinates(addressToEdit.coordinates || null);
    setEditingAddress(index);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAddressIndex !== null) {
      // If an address is selected, use it directly
      onSave(addresses[selectedAddressIndex]);
      setSelectedAddressIndex(null);
    } else {
      // Otherwise save the new/edited address
      onSave({
        name,
        address,
        landmark,
        mobile,
        type: addressType,
        coordinates: coordinates || undefined,
      });
    }
    setName("");
    setAddress("");
    setLandmark("");
    setMobile("");
    setAddressType("home");
    setCoordinates(null);
    setShowForm(false);
    setEditingAddress(null);
    onClose();
  };

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use OpenStreetMap's Nominatim service for geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en-US,en;q=0.9",
              },
            }
          );

          const data = await response.json();

          // Format the address
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          const addressComponents = [];
          if (data.address) {
            if (data.address.road) addressComponents.push(data.address.road);
            if (data.address.suburb)
              addressComponents.push(data.address.suburb);
            if (data.address.city) addressComponents.push(data.address.city);
            if (data.address.state) addressComponents.push(data.address.state);
          }

          const formattedAddress = addressComponents.join(", ");
          setCurrentLocation(formattedAddress);

          // Auto-fill the address form
          setAddress(formattedAddress);
          setShowForm(true);
        } catch (error) {
          setLocationError("Failed to get address from coordinates");
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Please allow location access"
            : "Failed to get your location"
        );
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-4 bg-orange-50 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">
            {showForm
              ? editingAddress !== null
                ? "Edit Address"
                : "Add New Address"
              : "Saved Addresses"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}

        {/* Add New Address Button */}
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b"
        >
          <Plus className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium">Add address</span>
        </button>

        {/* Current Location */}
        <button
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors border-b relative"
        >
          <MapPin className="w-5 h-5 text-primary" />
          <div className="flex-1 text-left">
            <span className="text-primary font-medium block">
              Use your current location
            </span>
            <span className="text-sm text-gray-500 line-clamp-1">
              {isLoadingLocation ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Getting your location...
                </span>
              ) : locationError ? (
                <span className="text-red-500">{locationError}</span>
              ) : (
                currentLocation || "Click to detect your location"
              )}
            </span>
          </div>
        </button>

        {!showForm ? (
          <div className="p-4">
            {/* Saved Addresses Section */}
            {addresses.length > 0 && (
              <div className="space-y-2">
                {addresses.map((addr, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedAddressIndex(index);
                      handleSubmit(new Event("submit") as React.FormEvent);
                    }}
                    className={`w-full flex items-start gap-2 p-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors border ${
                      selectedAddressIndex === index
                        ? "border-primary bg-primary/5"
                        : "border-gray-100"
                    }`}
                  >
                    <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-900">
                          {addr.name}
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(index);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Pencil className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                        {addr.address}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {addr.mobile}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Delivery Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your complete address"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter a nearby landmark"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your mobile number"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Address Type
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAddressType("home")}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${
                    addressType === "home"
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="text-xs">Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddressType("office")}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${
                    addressType === "office"
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Office</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddressType("hotel")}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${
                    addressType === "hotel"
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Hotel className="w-3.5 h-3.5" />
                  <span className="text-xs">Hotel</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {editingAddress !== null ? "Update Address" : "Save Address"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
