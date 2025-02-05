import React, { useState, useEffect } from "react";
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
  mobile: string;
  type: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  editAddress?: Address | null;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editAddress,
}) => {
  const { addresses } = useAuth();
  const [name, setName] = useState(editAddress?.name || "");
  const [addressName, setAddressName] = useState(editAddress?.type || "");
  const [address, setAddress] = useState(editAddress?.address || "");
  const [mobile, setMobile] = useState(editAddress?.mobile || "");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  // Update form when editAddress changes
  useEffect(() => {
    if (editAddress) {
      setName(editAddress.name);
      setAddress(editAddress.address);
      setAddressName(editAddress.type || "");
      setMobile(editAddress.mobile);
      setCoordinates(editAddress.coordinates || null);
    }
  }, [editAddress]);

  const handleAddNewClick = () => {
    setEditingAddress(null);
    setName("");
    setAddressName("");
    setAddress("");
    setMobile("");
    setCoordinates(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddress = {
      name,
      address,
      type: addressName,
      mobile,
      coordinates: coordinates || undefined,
    };
    onSave(newAddress);
    setName("");
    setAddressName("");
    setAddress("");
    setMobile("");
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
          // Auto-show form when location is set
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
            {editAddress ? "Edit Address" : "Add New Address"}
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
              Address Name
            </label>
            <input
              type="text"
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Home, Office, Parent's House"
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
              {editAddress ? "Update Address" : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
