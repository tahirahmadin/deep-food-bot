import React from "react";
import { Bike, MapPin } from "lucide-react";
import { Message } from "../../types";
import { useChatContext } from "../../context/ChatContext";
import { useRestaurant } from "../../context/RestaurantContext";
import { MenuList } from "../MenuList";
import * as menuUtils from "../../utils/menuUtils";

interface MenuMessageProps {
  message: Message;
  selectedStyle: { name: string; image: string };
}

export const MenuMessage: React.FC<MenuMessageProps> = ({
  message,
  selectedStyle,
}) => {
  const { dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();

  const handleSelectRestro = (restroId: number) => {
    dispatch({ type: "SET_MODE", payload: "browse" });
    const restaurantName = menuUtils.getRestaurantNameById(
      restaurantState.restaurants,
      restroId
    );
    if (restaurantName !== "Unknown Restaurant") {
      dispatch({
        type: "SET_SELECTED_RESTAURANT",
        payload: restaurantName,
      });
    }
  };

  if (!message.llm) {
    return (
      <div className="pr-3 flex-shrink-0 flex">
        {message.isBot && selectedStyle && (
          <img
            src={selectedStyle.image}
            alt={selectedStyle.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-secondary mr-2"
          />
        )}
        <div className="text-[13px]">{message.text}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="pr-3 flex-shrink-0 flex">
        <img
          src={selectedStyle.image}
          alt={selectedStyle.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-secondary"
        />
        <p className="text-gray-600 text-[13px] pl-2">{message.text}</p>
      </div>

      {message.llm.output.items1?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() =>
                message.llm?.restroIds?.[0] &&
                handleSelectRestro(message.llm.restroIds[0])
              }
              className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium hover:bg-blue-600 transition-colors"
            >
              <span>
                {menuUtils.getRestaurantNameById(
                  restaurantState.restaurants,
                  message.llm?.restroIds?.[0] || 0
                )}
              </span>
            </button>
            <RestaurantBadges
              rating="4.5"
              deliveryTime="30-45"
              distance="2.5"
            />
          </div>

          <div className="mt-2 pl-3 flex items-center gap-2">
            <MenuList
              messageId={message.id}
              items={message.llm.output.items1}
              restroId={message.llm.restroIds[0]}
            />
          </div>
        </>
      )}

      {message.llm.output.items2?.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() =>
                message.llm?.restroIds?.[1] &&
                handleSelectRestro(message.llm.restroIds[1])
              }
              className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium hover:bg-blue-600 transition-colors"
            >
              <span>
                {menuUtils.getRestaurantNameById(
                  restaurantState.restaurants,
                  message.llm?.restroIds?.[1] || 0
                )}
              </span>
            </button>
            <RestaurantBadges
              rating="4.3"
              deliveryTime="35-50"
              distance="3.2"
            />
          </div>

          <div className="mt-2 pl-3 flex items-center gap-2">
            <MenuList
              messageId={message.id}
              items={message.llm.output.items2}
              restroId={message.llm.restroIds[1]}
            />
          </div>
        </>
      )}
    </div>
  );
};

interface RestaurantBadgesProps {
  rating: string;
  deliveryTime: string;
  distance: string;
}

const RestaurantBadges: React.FC<RestaurantBadgesProps> = ({
  rating,
  deliveryTime,
  distance,
}) => (
  <>
    <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      <span>{rating}</span>
    </div>
    <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
      <Bike className="w-3 h-3" />
      <span>{deliveryTime} min</span>
    </div>
    <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
      <MapPin className="w-3 h-3" />
      <span>{distance} km</span>
    </div>
  </>
);
