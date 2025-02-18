import React from "react";
import { Bike, MapPin } from "lucide-react";
import { useChatContext } from "../../context/ChatContext";
import { useRestaurant } from "../../context/RestaurantContext";
import { Message } from "../../types";

interface RestaurantMessageProps {
  message: Message;
}

export const RestaurantMessage: React.FC<RestaurantMessageProps> = ({
  message,
}) => {
  const { dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();

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
      <p className="text-sm text-gray-600 pl-2">{message.text}</p>
      {message.llm &&
        message.llm.restroIds &&
        message.llm.restroIds.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {message.llm.restroIds.map((restroId) => {
              const restaurant = restaurantState.restaurants.find(
                (r) => r.id === restroId
              );
              if (!restaurant) return null;
              return (
                <button
                  key={restroId}
                  onClick={() => handleSelectRestro(restroId)}
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
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                        <svg
                          className="w-3 h-3 text-green-600 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span className="text-xs font-medium text-green-600">
                          4.5
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {restaurant.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Bike className="w-3 h-3 text-orange-600" />
                        <span className="text-xs font-medium text-orange-600">
                          30-45 min
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">
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
