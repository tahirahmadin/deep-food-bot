import React from "react";
import { Bike, MapPin } from "lucide-react";
import { useChatContext } from "../../context/ChatContext";
import { useRestaurant } from "../../context/RestaurantContext";
import { Message } from "../../types";
import { useFiltersContext } from "../../context/FiltersContext";
import { useAuth } from "../../context/AuthContext";
import { calculateDistance } from "../../utils/distanceUtils";

interface RestaurantMessageProps {
  message: Message;
}

export const RestaurantMessage: React.FC<RestaurantMessageProps> = ({
  message,
}) => {
  const { dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { selectedStyle } = useFiltersContext();
  const { theme } = useFiltersContext();
  const { addresses } = useAuth();
  const selectedAddress = addresses[0];

  const handleSelectRestro = (restroId: number) => {
    dispatch({ type: "SET_MODE", payload: "browse" });
    dispatch({
      type: "SET_SELECTED_RESTAURANT",
      payload:
        restaurantState.restaurants.find((r) => r.id === restroId)?.name ||
        null,
    });
  };

  const getRestaurantDetails = (restroId: number) => {
    const restaurant = restaurantState.restaurants.find(
      (r) => r.id === restroId
    );
    if (
      !restaurant ||
      !selectedAddress?.coordinates ||
      !restaurant.location?.coordinates
    ) {
      return { distance: null, deliveryTime: null, rating: null };
    }

    const distance = calculateDistance(
      selectedAddress.coordinates.lat,
      selectedAddress.coordinates.lng,
      restaurant.location.coordinates[1],
      restaurant.location.coordinates[0]
    );

    // Calculate delivery time: distance * 6 minutes per km
    const deliveryTime = Math.ceil(distance * 6);

    return {
      distance: distance.toFixed(1),
      deliveryTime: `${deliveryTime}-${deliveryTime + 15}`,
      rating: restaurant.rating?.toFixed(1) || "4.5",
    };
  };

  return (
    <div className="space-y-3">
      {!message.isBot ? (
        <div className="pr-3 flex-shrink-0 flex">
          <p className="text-gray-100 text-[13px]">{message.text}</p>
        </div>
      ) : (
        <div className="pr-3 flex-shrink-0 flex">
          <img
            src={selectedStyle.image}
            alt={selectedStyle?.name || "Chat Style"}
            className="w-8 h-8 rounded-full object-cover border-2 border-secondary"
          />{" "}
          <p className="text-gray-600 text-[13px] pl-2">{message.text}</p>
        </div>
      )}
      {message.llm &&
        message.llm.restroIds &&
        message.llm.restroIds.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {message.llm.restroIds.map((restroId) => {
              const restaurant = restaurantState.restaurants.find(
                (r) => r.id === restroId
              );
              if (!restaurant) return null;

              const { distance, deliveryTime, rating } =
                getRestaurantDetails(restroId);

              return (
                <button
                  key={restroId}
                  onClick={() => {
                    dispatch({ type: "SET_MODE", payload: "browse" });
                    handleSelectRestro(restroId);
                  }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="aspect-[16/9] w-full relative">
                    <img
                      src={`${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${
                        restaurant.id
                      }/${restaurant.id}-0.jpg`}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-lg"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t to-transparent rounded-t-lg"
                      style={{
                        from: `${theme.cardBg}99`,
                      }}
                    />
                  </div>
                  <div
                    className="p-1"
                    style={{
                      backgroundColor: theme.cardBg,
                      color: theme.cardText,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[12px] font-medium text-gray-900">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-green-50 px-1 py-0.5 rounded-full">
                        <svg
                          className="w-3 h-3 fill-current"
                          style={{ color: theme.primary }}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span
                          className="text-[9px] font-medium"
                          style={{ color: theme.primary }}
                        >
                          {rating}
                        </span>
                      </div>
                    </div>
                    <p
                      className="text-[10px] line-clamp-2 text-left"
                      style={{ color: `${theme.cardText}99` }}
                    >
                      {restaurant.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      {deliveryTime && (
                        <div
                          className="flex items-center gap-1 px-1 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${theme.primary}20`,
                            color: theme.primary,
                          }}
                        >
                          <Bike className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-medium">
                            {deliveryTime} min
                          </span>
                        </div>
                      )}
                      {distance && (
                        <div
                          className="flex items-center gap-1 px-1 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${theme.primary}20`,
                            color: theme.primary,
                          }}
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-medium">
                            {distance} km
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: `${theme.primary}20`,
                        color: theme.primary,
                        ":hover": { backgroundColor: `${theme.primary}30` },
                      }}
                    >
                      View Menu
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
};
