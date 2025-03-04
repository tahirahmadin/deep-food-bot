import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Autocomplete } from "@react-google-maps/api";
import {
  getCurrentLocation,
  getAddressFromCoordinates,
  handleLocationError,
} from "../utils/distanceUtils";

const DEFAULT_ZOOM = 15;

interface GoogleMapWindow extends Window {
  initMap?: () => void;
  google?: any;
}

declare const window: GoogleMapWindow;

export const AddressModal: React.FC = () => {
  const {
    isAddressModalOpen,
    setIsAddressModalOpen,
    editingAddress,
    setEditingAddress,
    addresses,
    setAddresses,
    isAuthenticated,
  } = useAuth();
  const [name, setName] = useState("");
  const [addressName, setAddressName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [step, setStep] = useState<"location" | "details">("location");
  const [coordinates, setCoordinates] = useState<{
    lng: number;
  } | null>(editingAddress?.coordinates || null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchBox, setSearchBox] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(
    editingAddress?.coordinates || null
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const { showToast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);

  // Get current location on mount
  useEffect(() => {
    if (isAddressModalOpen && !coordinates && !editingAddress) {
      handleGetCurrentLocation();
    }
  }, [isAddressModalOpen]);

  useEffect(() => {
    if (editingAddress) {
      setName(editingAddress.name);
      setAddressName(editingAddress.type);
      setAddress(editingAddress.address);
      setMobile(editingAddress.mobile);
      if (editingAddress.coordinates) {
        setCoordinates(editingAddress.coordinates);
        setMapCenter(editingAddress.coordinates);
      }
    } else {
      resetForm();
    }
  }, [editingAddress]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (!isAddressModalOpen || !coordinates) return;

    // Load Google Maps with Places library
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      if (!mapRef.current) return;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      const markerInstance = new window.google.maps.Marker({
        map: mapInstance,
        position: coordinates,
        draggable: true,
      });

      // Initialize search box
      const searchBoxInput = document.getElementById(
        "location-search"
      ) as HTMLInputElement;
      if (searchBoxInput) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          searchBoxInput,
          {
            fields: ["formatted_address", "geometry", "name"],
            componentRestrictions: { country: "AE" }, // Restrict to UAE
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const newPosition = new google.maps.LatLng(lat, lng);

            setCoordinates({ lat, lng });
            mapInstance.setCenter(newPosition);
            markerInstance.setPosition(newPosition);
            setAddress(place.formatted_address || "");
            setSearchQuery(place.name || "");
          }
        });

        setSearchBox(autocomplete);
      }

      // Add click listener to map
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        handleMapClick(e);
      });

      // Add drag end listener to marker
      markerInstance.addListener("dragend", (e: google.maps.MapMouseEvent) => {
        handleMarkerDrag(e);
      });

      setMap(mapInstance);
      setMarker(markerInstance);

      // Cleanup
      return () => {
        if (markerInstance) markerInstance.setMap(null);
        if (mapInstance)
          delete window.google.maps.event.clearInstanceListeners(mapInstance);
      };
    };

    document.head.appendChild(script);

    return () => {
      window.initMap = undefined;
      document.head.removeChild(script);
    };
  }, [isAddressModalOpen, coordinates]);

  const resetForm = () => {
    setName("");
    setAddressName("");
    setAddress("");
    setMobile("");
    setSearchQuery("");
    setCoordinates(null);
    setStep("location");
  };

  const handleClose = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
    resetForm();
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      if (!marker) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newPosition = new google.maps.LatLng(lat, lng);

      marker.setPosition(newPosition);
      setCoordinates({ lat, lng });

      try {
        const newAddress = await getAddressFromCoordinates(
          lat,
          lng,
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        );
        setAddress(newAddress);
      } catch (error) {
        console.error("Error getting address:", error);
        showToast("Failed to get address from location", "error");
      }
    }
  };

  const handleMarkerDrag = async (e: google.maps.MapMouseEvent) => {
    if (e.latLng && marker) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newPosition = new google.maps.LatLng(lat, lng);

      marker.setPosition(newPosition);
      setCoordinates({ lat, lng });

      try {
        const newAddress = await getAddressFromCoordinates(
          lat,
          lng,
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        );
        setAddress(newAddress);
      } catch (error) {
        console.error("Error getting address:", error);
        showToast("Failed to get address from location", "error");
      }
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    setSearchQuery("");

    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;

      setCoordinates({ lat: latitude, lng: longitude });

      if (map && marker) {
        const newPosition = new google.maps.LatLng(latitude, longitude);
        map.setCenter(newPosition);
        marker.setPosition(newPosition);
      }

      const newAddress = await getAddressFromCoordinates(
        latitude,
        longitude,
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      );
      setAddress(newAddress);
    } catch (error) {
      const errorMessage = handleLocationError(error);
      setLocationError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleNextStep = () => {
    if (!coordinates) {
      showToast("Please select a location on the map", "error");
      return;
    }
    setStep("details");
  };

  const handleBackStep = () => {
    setStep("location");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Please sign in to save your address", "error");
      return;
    }

    if (!coordinates) {
      showToast("Please select a location on the map", "error");
      return;
    }

    const newAddress = {
      name,
      address,
      type: addressName,
      mobile,
      coordinates,
    };

    if (editingAddress && addresses) {
      const updatedAddresses = addresses.map((addr, index) =>
        index === editingAddress.index ? newAddress : addr
      );
      const success = await setAddresses(updatedAddresses);
      if (success) {
        showToast("Address updated successfully");
      } else {
        showToast("Failed to update address", "error");
      }
      setEditingAddress(null);
    } else {
      const updatedAddresses = [newAddress, ...addresses];
      const success = await setAddresses(updatedAddresses);
      if (success) {
        showToast("Address saved successfully");
      } else {
        showToast("Failed to save address", "error");
      }
    }

    resetForm();
    setIsAddressModalOpen(false);
  };

  const renderLocationStep = () => (
    <div className="p-4 space-y-1 relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-[250px] bg-gray-100 rounded-lg relative"
      />
      {/* Search Box */}
      <div className="absolute top-5 left-5 w-[85%]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id="location-search"
          type="text"
          placeholder="Search for area, street name..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={isLoadingLocation}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-left ${
          isLoadingLocation
            ? "bg-white/90 cursor-not-allowed"
            : "bg-white/90 hover:bg-white shadow-sm"
        }`}
      >
        {isLoadingLocation ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <MapPin className="w-5 h-5 text-primary" />
        )}
        <span className="text-sm font-medium text-gray-600">
          {isLoadingLocation
            ? "Getting your location..."
            : "Use current location"}
        </span>
      </button>

      {/* Location Info */}
      {locationError && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">
          {locationError}
        </div>
      )}

      {coordinates && (
        <div className="p-3 bg-white/90 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-1" />
            <div>
              <p className="text-xs text-gray-600">{address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {/* Continue Button */}
      <button
        onClick={handleNextStep}
        className="w-full py-2 text-white rounded-lg hover:bg-primary-600 transition-colors"
        style={{ backgroundColor: "orange" }}
      >
        Continue
      </button>
    </div>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <button
        type="button"
        onClick={handleBackStep}
        className="flex items-center gap-1 text-gray-600 mb-2"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
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
          Address
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          required
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Enter full address"
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

      <button
        type="submit"
        className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        style={{ backgroundColor: "orange" }}
      >
        Save Address
      </button>
    </form>
  );

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-in-out transform ${
        isAddressModalOpen
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      } bg-white shadow-xl w-full h-3/4 overflow-y-auto`}
    >
      <div className="px-4 py-1 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">
          {editingAddress ? "Edit Address" : "Add New Address"}
          {!isAuthenticated && (
            <span className="text-xs text-red-500 block mt-1">
              Sign in required to save address
            </span>
          )}
        </h2>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {step === "location" ? renderLocationStep() : renderDetailsStep()}
    </div>
  );
};
