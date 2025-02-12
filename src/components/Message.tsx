import React from "react";

import { AlertTriangle } from "lucide-react";
import { MenuList } from "./MenuList";
import { DeliveryForm } from "./DeliveryForm";
import { PaymentForm } from "./PaymentForm";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { useFiltersContext } from "../context/FiltersContext";
import * as menuUtils from "../utils/menuUtils";
import { useEffect } from "react";
import { Message as MessageType, QueryType } from "../types";

interface MessageProps {
  message: MessageType;
  onRetry: () => void;
}

export const Message: React.FC<MessageProps> = ({ message, onRetry }) => {
  const { state } = useChatContext();
  const {
    state: restaurantState,
    setActiveRestaurant,
    setRestaurants,
  } = useRestaurant();
  const { selectedStyle } = useFiltersContext();
  const { dispatch } = useChatContext();
  const messageRef = React.useRef(message);
  const isError =
    message.text.toLowerCase().includes("error") ||
    message.text.toLowerCase().includes("sorry");

  useEffect(() => {
    // Parse the message text to get restaurant IDs
    if (
      message.isBot &&
      JSON.stringify(messageRef.current) !== JSON.stringify(message)
    ) {
      messageRef.current = message;
      try {
        const parsedText = JSON.parse(message.text);
        if (parsedText.restroIds && Array.isArray(parsedText.restroIds)) {
          setRestaurants(parsedText.restroIds);
        }
      } catch (error) {
        console.log("Failed to parse message text for restaurant IDs");
      }
    }
  }, [message, setRestaurants]);

  const renderContent = () => {
    if (message.queryType === QueryType.CHECKOUT) {
      if (message.isBot && state.checkout.step === "details") {
        return <DeliveryForm onSubmit={onRetry} />;
      }
      if (message.isBot && state.checkout.step === "payment") {
        return <PaymentForm onSubmit={onRetry} />;
      }
    }

    return (
      <>
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Preview"
            className="h-32 object-cover rounded-lg mb-2"
          />
        )}

        {message.isBot && message.llm ? (
          <div>
            <div className="pr-3 flex-shrink-0 flex">
              <img
                src={selectedStyle.image}
                alt={selectedStyle.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-secondary"
              />{" "}
              <p className="text-gray-600 text-[13px] pl-2">{message.text}</p>
            </div>

            {message.llm.output.items1?.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span>
                    {menuUtils.getRestaurantNameById(
                      restaurantState.restaurants,
                      message.llm.restroIds[0]
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px]  font-medium">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span>4.5</span>
                </div>
              </div>
            )}

            {message.llm.output.items1.length > 0 && (
              <div className="mt-2 pl-3 flex items-center gap-2">
                <MenuList
                  messageId={message.id}
                  items={message.llm.output.items1}
                  restroId={message.llm.restroIds[0]}
                />
                <label
                  className={`inline-flex items-center gap-2 cursor-pointer ${
                    restaurantState.activeRestroId === message.llm.restroIds[0]
                      ? "text-primary"
                      : "text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="restaurantSelection" // Ensure consistent name for radio group
                    checked={
                      restaurantState.activeRestroId ===
                      message.llm?.restroIds[0]
                    }
                    onChange={() =>
                      message.llm?.restroIds[0] &&
                      handleSelectRestro(message.llm?.restroIds[0])
                    }
                    className="form-radio h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                </label>
              </div>
            )}
            {message.llm.output.items2?.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span>
                    {menuUtils.getRestaurantNameById(
                      restaurantState.restaurants,
                      message.llm.restroIds[1]
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px]  font-medium">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span>4.3</span>
                </div>
              </div>
            )}

            {message.llm.output.items2?.length > 0 && (
              <div className="mt-2 pl-3 flex items-center gap-2">
                <MenuList
                  messageId={message.id}
                  items={message.llm.output.items2}
                  restroId={message.llm.restroIds[1]}
                />
                <label
                  className={`inline-flex items-center gap-2 cursor-pointer ${
                    restaurantState.activeRestroId === message.llm.restroIds[1]
                      ? "text-primary"
                      : "text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="restaurantSelection" // Ensure consistent name for radio group
                    checked={
                      restaurantState.activeRestroId ===
                      message.llm?.restroIds[1]
                    }
                    onChange={() =>
                      message.llm?.restroIds[1] &&
                      handleSelectRestro(message.llm?.restroIds[1])
                    }
                    className="form-radio h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                </label>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              message.isBot
                ? "text-gray-800 text-[13px]"
                : "text-white text-[13px]"
            }
          >
            {message.text}
          </div>
        )}
      </>
    );
  };

  const handleSelectRestro = (restroId: number) => {
    // If clicking on already active restaurant, clear selection
    if (restaurantState.activeRestroId === restroId) {
    } else {
      setActiveRestaurant(restroId);
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
    }
  };

  // if (message.text && isError && message.isBot) {
  //   return (
  //     <div className="mb-4 flex justify-start">
  //       <div className="max-w-[90%] rounded-2xl p-3 bg-red-50 text-red-700">
  //         <div className="flex items-start gap-2">
  //           <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
  //           <p>{message.text}</p>
  //         </div>
  //         <span className="text-xs text-gray-500 mt-1 block">
  //           {message.time}
  //         </span>
  //         <button
  //           onClick={onRetry}
  //           className="mt-2 text-sm text-orange-500 hover:text-orange-600 transition-colors"
  //         >
  //           Try again
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div
      className={`mb-4 flex ${message.isBot ? "justify-start" : "justify-end"}`}
    >
      {/* {message.isBot && (
        <div className="mr-1 flex-shrink-0">
          <img
            src={selectedStyle.image}
            alt={selectedStyle.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-primary"
          />
        </div>
      )} */}
      <div
        className={`max-w-[90%] rounded-2xl p-2 ${
          message.isBot
            ? "bg-white/80 shadow-sm backdrop-blur-sm w-full sm:w-auto"
            : "bg-orange-500 text-white"
        }`}
      >
        {renderContent()}
        <span className="text-xs text-gray-500 mt-1 block">{message.time}</span>
      </div>
    </div>
  );
};
