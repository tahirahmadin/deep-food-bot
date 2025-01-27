import React from "react";
import { Message as MessageType } from "../types";
import { AlertTriangle } from "lucide-react";
import { MenuList } from "./MenuList";
import { DeliveryForm } from "./DeliveryForm";
import { PaymentForm } from "./PaymentForm";
import { useChatContext } from "../context/ChatContext";

interface MessageProps {
  message: MessageType;
  onRetry: () => void;
}

export const Message: React.FC<MessageProps> = ({ message, onRetry }) => {
  const { state } = useChatContext();
  const isError =
    message.text.toLowerCase().includes("error") ||
    message.text.toLowerCase().includes("sorry");

  const renderContent = () => {
    if (message.queryType === "CHECKOUT") {
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
            <p className="text-gray-600">{message.structuredText.text}</p>
            {message.structuredText.items?.length > 0 && (
              <div className="mt-2">
                <MenuList
                  messageId={message.id}
                  items={message.structuredText.items}
                />
              </div>
            )}
          </div>
        ) : (
          <div className={message.isBot ? "text-gray-800" : "text-white"}>
            {message.text}
          </div>
        )}
      </>
    );
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
