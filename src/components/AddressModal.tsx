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
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleAddNewClick = () => {
    setEditingAddress(null);
    setName("");
    setAddress("");
    setLandmark("");
    setMobile("");
    setAddressType("home");
    setCoordinates(null);
  };

  const handleEditClick = (index: number) => {
    const addressToEdit = addresses[index];
    setName(addressToEdit.name);
    setAddress(addressToEdit.address);
    setLandmark(addressToEdit.landmark || "");
    setMobile(addressToEdit.mobile);
    setAddressType(addressToEdit.type || "home");
    setCoordinates(addressToEdit.coordinates || null);
    setEditingAddress(index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      address,
      landmark,
      mobile,
      type: addressType,
      coordinates: coordinates || undefined,
    });
    setName("");
    setAddress("");
    setLandmark("");
    setMobile("");
    setAddressType("home");
    setCoordinates(null);
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
        <div className="p-3 bg-orange-50 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">
            {editingAddress !== null ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Current Location Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLoadingLocation}
            className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left mb-4"
          >
            <MapPin className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 block">
                Use current location
              </span>
              <span className="text-xs text-gray-500">
                {isLoadingLocation ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Getting location...
                  </span>
                ) : locationError ? (
                  <span className="text-red-500">{locationError}</span>
                ) : (
                  currentLocation || "Click to detect your location"
                )}
              </span>
            </div>
          </button>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
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
              rows={3}
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
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
              onClick={onClose}
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
      </div>
    </div>
  );
};
