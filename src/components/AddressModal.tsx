import React, { useState, useEffect } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

export const AddressModal: React.FC = () => {
  const {
    addNewAddress,
    isAddressModalOpen,
    setIsAddressModalOpen,
    editingAddress,
    setEditingAddress,
    addresses,
    setAddresses,
  } = useAuth();
  const [name, setName] = useState("");
  const [addressName, setAddressName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (editingAddress) {
      setName(editingAddress.name);
      setAddressName(editingAddress.type);
      setAddress(editingAddress.address);
      setMobile(editingAddress.mobile);
      setCoordinates(editingAddress.coordinates || null);
    } else {
      // Reset form when not editing
      setName("");
      setAddressName("");
      setAddress("");
      setMobile("");
      setCoordinates(null);
    }
  }, [editingAddress]);

  const getCurrentLocation = () => {
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
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });

          // Get address from coordinates using Geocoding API
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY
            }`
          );
          const data = await response.json();

          if (data.results && data.results[0]) {
            setAddress(data.results[0].formatted_address);
          }
        } catch (error) {
          setLocationError("Failed to get address from coordinates");
          console.error("Geocoding error:", error);
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? "Location permission denied"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAddress = {
      name,
      address,
      type: addressName,
      mobile,
      coordinates: coordinates || undefined,
    };

    if (editingAddress) {
      // Update existing address
      const updatedAddresses = addresses.map((addr, index) =>
        index === editingAddress.index ? newAddress : addr
      );
      await setAddresses(updatedAddresses);
      setEditingAddress(null);
    } else {
      // Add new address
      await addNewAddress(newAddress);
    }

    setName("");
    setAddressName("");
    setAddress("");
    setMobile("");
    setCoordinates(null);
    setIsAddressModalOpen(false);
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-in-out transform ${
        isAddressModalOpen ? "translate-y-0" : "translate-y-full"
      } bg-white shadow-xl w-full h-3/4 overflow-y-auto`}
    >
      <div className="px-4 py-2 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">
          {editingAddress ? "Edit Address" : "Add New Address"}
        </h2>
        <button
          onClick={() => {
            setIsAddressModalOpen(false);
            setEditingAddress(null);
          }}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-2 space-y-4 flex-1">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="w-full flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left relative"
        >
          {isLoadingLocation ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 text-primary" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {isLoadingLocation
              ? "Getting your location..."
              : "Use current location"}
          </span>
        </button>
        {locationError && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
            {locationError}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Delivery Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter your complete address"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Address Name
          </label>
          <input
            type="text"
            value={addressName}
            onChange={(e) => setAddressName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Home, Office, Parent's House"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter your mobile number"
          />
        </div>
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={() => {
              setIsAddressModalOpen(false);
              setEditingAddress(null);
            }}
            className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Save Address
          </button>
        </div>
      </form>
    </div>
  );
};
