import React, { useRef, useEffect, useMemo } from "react";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { useChatContext } from "../context/ChatContext";
import { MenuItem } from "./MenuItem";
import { useState } from "react";
import { Menu } from "lucide-react";
import { MenuItemFront } from "../types/menu";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";
import { RestaurantCard } from "./RestaurantCard";

interface ChatPanelProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
  queryType?: string;
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
  const [allMenuItems, setAllMenuItems] = useState<MenuItemFront[]>([]);
  const { state: restaurantState, dispatch: restaurantDispatch } =
    useRestaurant();

  useEffect(() => {
    async function asyncFn() {
      try {
        if (
          restaurantState.activeRestroId &&
          !restaurantState.menus[restaurantState.activeRestroId]
        ) {
          const menuItems = await getMenuByRestaurantId(
            restaurantState.activeRestroId,
            restaurantState,
            restaurantDispatch
          );
          setAllMenuItems(menuItems);
        } else {
          if (restaurantState.activeRestroId) {
            setAllMenuItems(
              restaurantState.menus[restaurantState.activeRestroId] || []
            );
          }
        }
      } catch (error) {
        console.error("Error loading menu items:", error);
        setAllMenuItems([]);
      }
    }
    asyncFn();
  }, [restaurantState.activeRestroId, restaurantState, restaurantDispatch]);

  // Extract unique categories
  const categories = useMemo(() => {
    if (allMenuItems.length === 0) return [];
    return Array.from(
      new Set(allMenuItems.map((item) => item.category).filter(Boolean))
    ).sort();
  }, [allMenuItems]);

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
      console.log("messages");
      console.log(state.messages);
      let result = state.messages.map((message) => {
        if (message.isBot && message.text) {
          try {
            // Parse the text field into JSON
            const parsedText = JSON.parse(message.text);
            console.log("parsedText");
            console.log(parsedText);
            // Validate the JSON structure
            if (
              parsedText &&
              typeof parsedText === "object" &&
              "text" in parsedText &&
              "items1" in parsedText
            ) {
              // Restructure the message object
              return {
                id: message.id,
                isBot: message.isBot,
                time: message.time,
                restroIds: message.restroIds,
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
    onSubmit(e); // Pass serialized memory along with form submission
  };

  const loadingMessage = () => {
    const content = [
      "Finding best options...",
      "Talking to Gobbl...",
      "Curating options...",
      "Scanning menu...",
      "Cooking best choices...",
      "Checking fresh items...",
      "Gathering tasty options...",
      "Matching your cravings...",
      "Assembling meal list...",
      "Fetching recommendations...",
      "Exploring hidden gems...",
    ];

    return content[Math.floor(Math.random() * content.length)];
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
        {console.log("cleanMessages")}
        {console.log(cleanMessages)}

        {state.isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <span
              className="font-sans animate-pulse inline-block ml-4 text-sm"
              style={{ transform: "skew(-10deg)" }}
            >
              {loadingMessage()}
            </span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "0.6s",
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {state.mode === "browse" && (
        <div className="flex-1 flex bg-white/30 backdrop-blur-sm overflow-y-auto">
          {!restaurantState.activeRestroId ? (
            // Restaurant List View
            <div className="flex-1 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Available Restaurants
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {restaurantState.restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    id={restaurant.id}
                    name={restaurant.name}
                    description={restaurant.description}
                    image={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurant.id}-0.jpg`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
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
                      className={`w-full text-left px-2 py-2 rounded-lg text-xs transition-colors ${
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
                      restaurant={item.restaurant}
                      image={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurantState.activeRestroId}-${item.id}.jpg`}
                      quantity={0}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
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
