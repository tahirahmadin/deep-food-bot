import React from "react";
import { Message as MessageType, QueryType } from "../types";
import { AlertTriangle } from "lucide-react";
import { MenuList } from "./MenuList";
import { DeliveryForm } from "./DeliveryForm";
import { PaymentForm } from "./PaymentForm";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import * as menuUtils from "../utils/menuUtils";
import { useEffect } from "react";

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
  const { dispatch: chatDispatch } = useChatContext();
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

        {message.isBot && message.structuredText ? (
          <div>
            <p className="text-gray-600 text-[14px]">
              {message.structuredText?.text}
            </p>
            {message.structuredText?.items1?.length > 0 && (
              <div className="flex items-center gap-1 mt-2 mb-3">
                <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span>
                    {menuUtils.getRestaurantNameById(
                      restaurantState.selectedRestroIds[0]
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

            {message.structuredText?.items1?.length > 0 && (
              <div className="mt-2 pl-3 flex items-center gap-2">
                <MenuList
                  messageId={message.id}
                  items={message.structuredText.items1}
                />
                <button
                  onClick={() =>
                    restaurantState.selectedRestroIds[0] &&
                    handleSelectRestro(restaurantState.selectedRestroIds[0])
                  }
                  className={`h-6 px-2 text-xs font-medium rounded-lg transition-all ${
                    restaurantState.activeRestroId ===
                    restaurantState.selectedRestroIds[0]
                      ? "bg-primary text-white"
                      : "text-primary hover:bg-primary-50"
                  }`}
                >
                  {restaurantState.activeRestroId ===
                  restaurantState.selectedRestroIds[0]
                    ? "Selected"
                    : "Choose"}
                </button>
              </div>
            )}
            {message.structuredText?.items2?.length > 0 && (
              <div className="flex items-center gap-1 mt-2 mb-3">
                <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span>
                    {menuUtils.getRestaurantNameById(
                      restaurantState.selectedRestroIds[1]
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

            {message.structuredText?.items2?.length > 0 && (
              <div className="mt-2 pl-3 flex items-center gap-2">
                <MenuList
                  messageId={message.id}
                  items={message.structuredText.items2}
                />
                <button
                  onClick={() =>
                    restaurantState.selectedRestroIds[1] &&
                    handleSelectRestro(restaurantState.selectedRestroIds[1])
                  }
                  className={`h-6 px-2 text-xs font-medium rounded-lg transition-all ${
                    restaurantState.activeRestroId ===
                    restaurantState.selectedRestroIds[1]
                      ? "bg-primary text-white"
                      : "text-primary hover:bg-primary-50"
                  }`}
                >
                  {restaurantState.activeRestroId ===
                  restaurantState.selectedRestroIds[1]
                    ? "Selected"
                    : "Choose"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={
              message.isBot
                ? "text-gray-800 text-[14px]"
                : "text-white text-[14px]"
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
      // Clear active restaurant and selected restaurant name
      // Clear active restaurant only
      setActiveRestaurant(null);
      chatDispatch({ type: "SET_SELECTED_RESTAURANT", payload: null });
    } else {
      // Set new active restaurant and update selected restaurant name
      // Set new active restaurant only
      setActiveRestaurant(restroId);
      const restaurantName = menuUtils.getRestaurantNameById(restroId);
      if (restaurantName !== "Unknown Restaurant") {
        chatDispatch({
          type: "SET_SELECTED_RESTAURANT",
          payload: restaurantName,
        });
      }
    }
  };

  if (message.text && isError && message.isBot) {
    return (
      <div className="mb-4 flex justify-start">
        <div className="max-w-[90%] rounded-2xl p-3 bg-red-50 text-red-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
            <p>{message.text}</p>
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            {message.time}
          </span>
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-orange-500 hover:text-orange-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-4 flex ${message.isBot ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[90%] rounded-2xl p-3 ${
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
