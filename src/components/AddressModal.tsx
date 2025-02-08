import React, { useState, useEffect } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
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

interface AddressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  editAddress?: Address | null;
}

export const AddressModal: React.FC<AddressDrawerProps> = ({
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (editAddress) {
      setName(editAddress.name);
      setAddress(editAddress.address);
      setAddressName(editAddress.type || "");
      setMobile(editAddress.mobile);
      setCoordinates(editAddress.coordinates || null);
    }
  }, [editAddress]);

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
    onClose();
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-in-out transform ${
        isOpen ? "translate-y-0" : "translate-y-full"
      } bg-white shadow-xl w-full h-3/4 overflow-y-auto`}
    >
      <div className="px-4 py-2 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">
          {editAddress ? "Edit Address" : "Add New Address"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-2 space-y-4 flex-1">
        <button
          type="button"
          onClick={() => {}}
          className="w-full flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
        >
          <MapPin className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-gray-900">
            Use current location
          </span>
        </button>
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
            onClick={onClose}
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
