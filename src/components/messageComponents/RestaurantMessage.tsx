import React from "react";
import { Bike, MapPin } from "lucide-react";
import { useChatContext } from "../../context/ChatContext";
import { useRestaurant } from "../../context/RestaurantContext";
import { Message } from "../../types";
import { useFiltersContext } from "../../context/FiltersContext";

interface RestaurantMessageProps {
  message: Message;
}

export const RestaurantMessage: React.FC<RestaurantMessageProps> = ({
  message,
}) => {
  const { dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { selectedStyle, isVegOnly, isFastDelivery, numberOfPeople } =
    useFiltersContext();

  const handleSelectRestro = (restroId: number) => {
    dispatch({ type: "SET_MODE", payload: "browse" });
    dispatch({
      type: "SET_SELECTED_RESTAURANT",
      payload:
        restaurantState.restaurants.find((r) => r.id === restroId)?.name ||
        null,
    });
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
                      src={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurant.id}/${restaurant.id}-0.jpg`}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[12px] font-medium text-gray-900">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-green-50 px-1 py-0.5 rounded-full">
                        <svg
                          className="w-3 h-3 text-green-600 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="text-[9px] font-medium text-green-600">
                          4.5
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 text-left">
                      {restaurant.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 bg-orange-50 px-1 py-0.5 rounded-full">
                        <Bike className="w-2.5 h-2.5 text-orange-600" />
                        <span className="text-[8px] font-medium text-orange-600">
                          30-45 min
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50 px-1 py-0.5 rounded-full">
                        <MapPin className="w-2.5 h-2.5 text-blue-600" />
                        <span className="text-[8px] font-medium text-blue-600">
                          2.5 km
                        </span>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors">
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
