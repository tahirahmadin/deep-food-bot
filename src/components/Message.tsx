import React from "react";

import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
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
  const { state: chatState, dispatch } = useChatContext();
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
      // Handle order summary display
      try {
        const parsedContent = JSON.parse(message.text);
        if (parsedContent.orderSummary) {
          const { items, total, restaurant } = parsedContent.orderSummary;
          return (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Order Summary</h3>
                <span className="text-sm text-gray-500">{restaurant}</span>
              </div>

              <div className="space-y-2">
                {items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{item.quantity}x</span>
                      <span className="text-gray-800 text-xs">{item.name}</span>
                    </div>
                    <span className="text-gray-600 text-xs">
                      {(parseFloat(item.price) * item.quantity).toFixed(2)} AED
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    Total Amount
                  </span>
                  <span className="font-bold text-primary">{total} AED</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600 mb-3">
                  How would you like to pay?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      dispatch({ type: "SET_PAYMENT_METHOD", payload: "card" });
                      dispatch({
                        type: "SET_CHECKOUT_STEP",
                        payload: "payment",
                      });
                      dispatch({
                        type: "ADD_MESSAGE",
                        payload: {
                          id: Date.now(),
                          text: "Please complete your card payment.",
                          isBot: true,
                          time: new Date().toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          }),
                          queryType: QueryType.CHECKOUT,
                        },
                      });
                    }}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                  >
                    Credit/Debit Card
                  </button>
                  <button
                    onClick={() => {
                      dispatch({
                        type: "SET_PAYMENT_METHOD",
                        payload: "crypto",
                      });
                      dispatch({
                        type: "SET_CHECKOUT_STEP",
                        payload: "payment",
                      });
                      dispatch({
                        type: "ADD_MESSAGE",
                        payload: {
                          id: Date.now(),
                          text: "Please complete your USDT payment.",
                          isBot: true,
                          time: new Date().toLocaleString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          }),
                          queryType: QueryType.CHECKOUT,
                        },
                      });
                    }}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                  >
                    Pay with USDT
                  </button>
                </div>
              </div>
            </div>
          );
        }
      } catch (e) {
        // Not a JSON message, continue with normal flow
      }

      // Handle payment method selection
      if (message.text.includes("How would you like to pay")) {
        return (
          <div className="space-y-3">
            <p className="text-gray-800 text-sm">{message.text}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  dispatch({ type: "SET_PAYMENT_METHOD", payload: "card" });
                  dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
                }}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                Credit/Debit Card
              </button>
              <button
                onClick={() => {
                  dispatch({ type: "SET_PAYMENT_METHOD", payload: "crypto" });
                  dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
                }}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
              >
                Pay with USDT
              </button>
            </div>
          </div>
        );
      }

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
        {message.queryType === "CHECKOUT" &&
          message.isBot &&
          (() => {
            try {
              const orderData = JSON.parse(message.text);
              if (orderData.success && orderData.orderDetails) {
                const { orderDetails } = orderData;
                return (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-primary/10 to-green-600/5 animate-gradient" />

                    <div className="relative">
                      {/* Success Header */}
                      <div className="text-center mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg animate-success-bounce">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-0.5">
                          Order Confirmed!
                        </h3>
                        <p className="text-primary font-medium">
                          {orderDetails.restaurant}
                        </p>
                      </div>

                      {/* Order Image & Details */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-2 shadow-inner">
                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-200">
                          {orderDetails.firstItemImage && (
                            <img
                              src={orderDetails.firstItemImage}
                              alt="Order"
                              className="w-16 h-16 rounded-lg object-cover shadow-md"
                            />
                          )}
                          <div className="flex-1">
                            <div className="space-y-1">
                              {orderDetails.items.map(
                                (item: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-gray-600">
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="text-gray-800 font-medium">
                                      {(
                                        parseFloat(item.price) * item.quantity
                                      ).toFixed(2)}{" "}
                                      AED
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Amount
                            </span>
                            <span className="text-lg font-bold text-primary">
                              {orderDetails.total} AED
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Payment Method
                            </span>
                            <span className="text-xs font-medium text-gray-800 bg-white px-2 py-0.5 rounded-full shadow-sm">
                              {orderDetails.paymentMethod === "card"
                                ? "Credit Card"
                                : "USDT"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div className="bg-white rounded-lg px-2 py-1 border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">
                            Delivery Details
                          </p>
                        </div>
                        <div className="space-y-0.5 pl-5">
                          <p className="text-xs font-medium text-gray-800">
                            {orderDetails.deliveryDetails.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {orderDetails.deliveryDetails.address}
                          </p>
                          <p className="text-xs text-gray-600">
                            {orderDetails.deliveryDetails.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return <p className="text-gray-800 text-sm">{message.text}</p>;
            } catch (e) {
              return <p className="text-gray-800 text-sm">{message.text}</p>;
            }
          })()}

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
            {message.queryType !== "CHECKOUT" && message.text}
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
