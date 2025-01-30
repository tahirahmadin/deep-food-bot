import React, { useRef, useEffect, useMemo } from "react";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { useChatContext } from "../context/ChatContext";
import { MenuItem } from "./MenuItem";
import { MenuItemWithImage as allMenuItems } from "../data/menuDataFront";
import { useState } from "react";
import { Menu } from "lucide-react";

interface ChatPanelProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent, serializedMemory: string) => void;
  placeholder: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  input,
  setInput,
  onSubmit,
  onImageUpload,
  placeholder,
  isLoading = false,
}) => {
  const { state } = useChatContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract unique categories
  const categories = Array.from(
    new Set(allMenuItems.map((item) => item.category).filter(Boolean))
  ).sort();

  // Filter menu items by category
  const filteredMenuItems = selectedCategory
    ? allMenuItems.filter((item) => item.category === selectedCategory)
    : allMenuItems;

  // Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [state.messages]);

  // Serialize messages for maintaining memory context
  const serializedMemory = useMemo(() => {
    return state.messages
      .map((message) =>
        message.isBot ? `Bot: ${message.text}` : `User: ${message.text}`
      )
      .join("\n");
  }, [state.messages]);

  // Use cleanMessages without modification
  const cleanMessages = useMemo(() => {
    if (state.messages?.length > 0) {
      let result = state.messages.map((message) => {
        if (message.isBot && message.text) {
          try {
            // Parse the text field into JSON
            console.log(JSON.parse(message.text));
            const parsedText = JSON.parse(message.text);
            console.log("typeof");
            console.log(typeof parsedText === "object");

            console.log(message.id);
            console.log("text" in parsedText);
            console.log("items" in parsedText);

            // Validate the JSON structure
            if (
              parsedText &&
              typeof parsedText === "object" &&
              "text" in parsedText &&
              "items1" in parsedText
            ) {
              // Restructure the message object
              console.log("Going here last try");
              console.log(parsedText);
              console.log(parsedText.text);
              return {
                id: message.id,
                isBot: message.isBot,
                time: message.time,
                text: message.text,
                queryType: message.queryType,
                structuredText: {
                  text: parsedText.text,
                  items1: parsedText.items1,
                  items2: parsedText.items2,
                },
              };
            }
          } catch (error) {
            console.log("Failed to parse message as JSON:", error);
            return message;
          }
          // If JSON parsing fails or validation fails, return the original message
          return message;
        } else {
          return message;
        }
      });

      return result;
    } else {
      return [];
    }
  }, [state.messages]);

  // Handle submit and pass serialized memory
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, serializedMemory); // Pass serialized memory along with form submission
  };

  return (
    <>
      <div
        className={`flex-1 overflow-y-auto p-4 bg-white/30 backdrop-blur-sm scroll-smooth ${
          state.mode === "browse" ? "hidden" : ""
        }`}
        ref={chatContainerRef}
      >
        {cleanMessages.map((message) => (
          <Message key={message.id} message={message} onRetry={() => {}} />
        ))}

        {state.isLoading && (
          <div className="flex justify-center">
            <img
              src="https://i.pinimg.com/originals/f0/ca/90/f0ca90dd6924e009d86f4421cf2032b5.gif"
              className="h-24"
            />
          </div>
        )}
      </div>

      {state.mode === "browse" && (
        <div className="flex-1 flex bg-white/30 backdrop-blur-sm overflow-y-auto">
          {/* Categories Panel */}
          <div className="w-1/3 border-r border-white/20 overflow-y-auto">
            <div className="p-3 bg-orange-50 border-b border-white/20">
              <div className="flex items-center gap-2 text-orange-800">
                <Menu className="w-4 h-4" />
                <span className="font-medium">Categories</span>
              </div>
            </div>
            <div className="space-y-1 p-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === null
                    ? "bg-orange-100 text-orange-800"
                    : "hover:bg-gray-100"
                }`}
              >
                All Items
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category
                      ? "bg-orange-100 text-orange-800"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-scroll p-4">
            <div className="grid grid-cols-2 gap-4">
              {filteredMenuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  image={item.image}
                  quantity={0}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <ChatInput
        className={state.mode === "browse" ? "hidden" : ""}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        showQuickActions={state.messages.length <= 1}
        onImageUpload={onImageUpload}
        placeholder={placeholder}
        isLoading={isLoading}
      />
    </>
  );
};
