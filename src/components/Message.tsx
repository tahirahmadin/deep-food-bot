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
            <p className="text-gray-600 text-[14px]">
              {message.structuredText.text}
            </p>
            {message.structuredText.items1?.length > 0 && (
              <div className="flex items-center gap-1 mt-2 mb-3">
                <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span>Papa Johns</span>
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

            {message.structuredText.items1?.length > 0 && (
              <div className="mt-2 pl-3">
                <MenuList
                  messageId={message.id}
                  items={message.structuredText.items1}
                />
              </div>
            )}
            {message.structuredText.items2?.length > 0 && (
              <div className="flex items-center gap-1 mt-2 mb-3">
                <div className="flex items-center gap-1.5 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <span>Art of Dum</span>
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

            {message.structuredText.items2?.length > 0 && (
              <div className="mt-2 pl-3">
                <MenuList
                  messageId={message.id}
                  items={message.structuredText.items2}
                />
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
