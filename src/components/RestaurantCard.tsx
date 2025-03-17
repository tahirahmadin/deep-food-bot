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

  // Check if restaurant is boosted
  const isBoosted = React.useMemo(() => {
    const restaurant = restaurantState.restaurants.find((r) => r.id === id);
    return restaurant?.isBoosted || Math.random() < 0.3; // Temporary random boosting for demo
  }, [id, restaurantState.restaurants]);

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
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {isBoosted && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[8px] font-medium backdrop-blur-sm flex items-center gap-1 shadow-md border border-purple-300/20"
            style={{
              background:
                "linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(88, 28, 135, 0.9))",
              color: "#FFD700",
            }}
          >
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            <span className="tracking-wider">PRO</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="font-medium text-gray-900 line-clamp-2 text-md"
            style={{
              color: theme.menuItemText,
            }}
          >
            {name}
          </h3>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 bg-green-50 px-1 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-green-600 fill-current" />
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
          </div>
        </div>
        <p
          className="text-xs line-clamp-2"
          style={{
            color: theme.text + "99",
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
