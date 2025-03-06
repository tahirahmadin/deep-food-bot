import React from "react";
import { Store, Star } from "lucide-react";
import { useRestaurant } from "../context/RestaurantContext";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { calculateDistance } from "../utils/distanceUtils";
import { MapPin, Bike } from "lucide-react";
import { useFiltersContext } from "../context/FiltersContext";

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
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();
  const { theme } = useFiltersContext();

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
      className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      style={{
        backgroundColor: theme.menuItemBg,
      }}
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
      <div className="p-2">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="font-medium text-gray-900 line-clamp-1 text-md  min-h-[1.5rem]"
            style={{
              color: theme.menuItemText,
            }}
          >
            {name}
          </h3>
          <div className="flex items-center gap-1  ">
            <div className="flex items-center gap-1 bg-green-50 px-1 py-0.5 rounded-full">
              <Star className="w-1.5 h-1.5 text-green-600 fill-current" />
              <span className="text-[9px] font-medium text-green-600">
                {rating}
              </span>
            </div>
            {deliveryTime && (
              <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                <Bike className="w-2 h-2 text-orange-600" />
                <span className="text-xs font-medium text-orange-600">
                  {deliveryTime} min
                </span>
              </div>
            )}
            {distance && (
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                <MapPin className="w-2 h-2 text-blue-600" />
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
        <p
          className="text-xs opacity-70 line-clamp-2 min-h-[2rem]"
          style={{
            color: theme.text,
          }}
        >
          {description}
        </p>
        <button
          className="mt-3 w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
          style={{
            color: theme.background,
            backgroundColor: theme.primary,
          }}
        >
          View Menu
        </button>
      </div>
    </div>
  );
};
