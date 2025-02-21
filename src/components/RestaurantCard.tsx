import React from "react";
import { Store, Star } from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { calculateDistance } from "../utils/distanceUtils";
import { MapPin, Bike } from "lucide-react";

interface RestaurantCardProps {
  id: number;
  name: string;
  description: string;
  image?: string;
  location?: {
    coordinates: number[];
  };
  coordinates?: number[];
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  name,
  description,
  location,
  coordinates,
  image = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
}) => {
  const { setActiveRestaurant } = useRestaurant();
  const { dispatch } = useChatContext();
  const { addresses } = useAuth();
  const selectedAddress = addresses[0];

  // Calculate distance and delivery time if coordinates are available
  const { distance, deliveryTime } = React.useMemo(() => {
    if (selectedAddress?.coordinates && location?.coordinates) {
      const dist = calculateDistance(
        selectedAddress.coordinates.lat,
        selectedAddress.coordinates.lng,
        location.coordinates[1],
        location.coordinates[0]
      );
      // Calculate delivery time: distance * 6 minutes per km
      const time = Math.ceil(dist * 6);
      return {
        distance: dist.toFixed(1),
        deliveryTime: `${time}-${time + 15}`,
      };
    }
    return { distance: null, deliveryTime: null };
  }, [selectedAddress, location]);

  // Get restaurant rating
  const rating = React.useMemo(() => {
    const restaurant = restaurantState.restaurants.find((r) => r.id === id);
    return restaurant?.rating?.toFixed(1) || "4.5";
  }, [id, restaurantState.restaurants]);

  const handleSelectRestaurant = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Setting active restaurant:", id);
    setActiveRestaurant(id);
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: name });
    dispatch({ type: "SET_MODE", payload: "browse" });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => handleSelectRestaurant(e)}
      onKeyDown={(e) => e.key === "Enter" && handleSelectRestaurant(e)}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Image Section */}
      <div className="aspect-[16/9] w-full relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 line-clamp-1">{name}</h3>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-green-600 fill-current" />
              <span className="text-xs font-medium text-green-600">
                {rating}
              </span>
            </div>
            {deliveryTime && (
              <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                <Bike className="w-3 h-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-600">
                  {deliveryTime} min
                </span>
              </div>
            )}
            {distance && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">
                  {distance} km
                </span>
              </div>
            )}
            {distance && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">
                  {distance} km
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
        <button className="mt-3 w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors">
          View Menu
        </button>
      </div>
    </div>
  );
};
