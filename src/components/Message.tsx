import React, { useState, useEffect } from "react";
import { Message as MessageType, QueryType } from "../types";
import { useChatContext } from "../context/ChatContext";
import { useFiltersContext } from "../context/FiltersContext";
import { MessageSkeleton } from "./messageComponents/MessageSkelton";
import { TypingEffect } from "./messageComponents/TypingEffect";
import { MenuMessage } from "./messageComponents/MenuMessage";
import { OrderMessage } from "./messageComponents/OrderMessage";
import { RestaurantMessage } from "./messageComponents/RestaurantMessage";

interface MessageProps {
  message: MessageType;
  onRetry: () => void;
}

export const Message: React.FC<MessageProps> = ({ message, onRetry }) => {
  const { state } = useChatContext();
  const { selectedStyle, theme } = useFiltersContext();
  const [isLoading, setIsLoading] = useState(true);
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);

  // Only show typing effect for the first message
  useEffect(() => {
    if (message.isBot && message.id === 1 && !typingComplete) {
      setShowTypingEffect(true);
    }
  }, [message.isBot, message.id, typingComplete]);

  useEffect(() => {
    // Simulate loading time for skeleton
    if (message.isBot) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [message]);

  const renderContent = () => {
    if (message.queryType === QueryType.RESTAURANT_QUERY) {
      return <RestaurantMessage message={message} />;
    }

    if (message.queryType === QueryType.CHECKOUT) {
      return <OrderMessage message={message} />;
    }

    if (message.imageUrl) {
      return (
        <img
          src={message.imageUrl}
          alt="Preview"
          className="h-32 object-cover rounded-lg mb-2"
        />
      );
    }

    return <MenuMessage message={message} selectedStyle={selectedStyle} />;
  };

  return (
    <div
      className={`mb-4 mt-3 flex ${
        message.isBot ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-[90%] rounded-2xl p-2 ${
          message.isBot
            ? "shadow-sm backdrop-blur-sm w-full sm:w-auto"
            : "text-white"
        }`}
        style={{
          backgroundColor: message.isBot ? `${theme.cardBg}` : theme.primary,
          color: message.isBot ? theme.text : "#FFFFFF",
          transition: "all 0.3s ease",
        }}
      >
        {message.isBot && isLoading && !showTypingEffect && !typingComplete ? (
          <MessageSkeleton
            type={
              message.llm?.output?.items1?.length > 0 ? "restaurant" : "menu"
            }
          />
        ) : showTypingEffect && !typingComplete ? (
          <div className="pr-3 flex-shrink-0 flex">
            {selectedStyle && (
              <img
                src={selectedStyle.image}
                alt={selectedStyle.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-secondary mr-3"
              />
            )}
            <div className="text-[13px]" style={{ color: theme.text }}>
              <TypingEffect
                text={message.text}
                onComplete={() => setTypingComplete(true)}
              />
            </div>
          </div>
        ) : (
          renderContent()
        )}
        <span
          className="text-xs mt-1 block opacity-60 "
          style={{
            color: message.isBot ? theme.cardHighlight : theme.filtersBg,
          }}
        >
          {message.time}
        </span>
      </div>
    </div>
  );
};
