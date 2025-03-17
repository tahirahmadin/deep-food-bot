import React from "react";
import { useRestaurant } from "../context/RestaurantContext";
import { useChatContext } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { calculateDistance } from "../utils/distanceUtils";
import { useFiltersContext } from "../context/FiltersContext";

interface FeaturedRestaurantCardProps {
  id: number;
  name: string;
  description: string;
  image?: string;
  location?: {
    coordinates: number[];
  };
}

export const FeaturedRestaurantCard: React.FC<FeaturedRestaurantCardProps> = ({
  id,
  name,
  description,
  location,
  image = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
}) => {
  const { state: restaurantState, setActiveRestaurant } = useRestaurant();
  const { theme } = useFiltersContext();
  const { dispatch } = useChatContext();
  const { addresses } = useAuth();
  const selectedAddress = addresses[0];

  // Calculate distance and delivery time
  const { distance, deliveryTime } = React.useMemo(() => {
    if (selectedAddress?.coordinates && location?.coordinates) {
      const dist = calculateDistance(
        selectedAddress.coordinates.lat,
        selectedAddress.coordinates.lng,
        location.coordinates[1],
        location.coordinates[0]
      );
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
    setActiveRestaurant(id);
    dispatch({ type: "SET_SELECTED_RESTAURANT", payload: name });
    dispatch({ type: "SET_MODE", payload: "browse" });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelectRestaurant}
      onKeyDown={(e) => e.key === "Enter" && handleSelectRestaurant(e)}
      className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      style={{ backgroundColor: theme.menuItemBg }}
    >
      {/* Image Section */}
      <div className="aspect-[4/3] w-full relative">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-black/50 backdrop-blur-sm text-white">
          {rating} ★
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h3
            className="font-medium line-clamp-1 text-sm"
            style={{ color: theme.menuItemText }}
          >
            {name}
          </h3>
        </div>
        <p
          className="text-[10px] line-clamp-1 mb-2"
          style={{ color: theme.text + "99" }}
        >
          {description}
        </p>
        <div className="flex items-center gap-1">
          {deliveryTime && (
            <div className="px-1 py-0.5 rounded text-[10px] font-medium bg-red-100/50 text-red-600">
              {deliveryTime} mins
            </div>
          )}
          {distance && (
            <div className="text-[10px] text-gray-500">{distance}KM</div>
          )}
        </div>
      </div>
    </div>
  );
};
