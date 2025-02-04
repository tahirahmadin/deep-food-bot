import React, { useRef, useEffect, useMemo } from "react";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { useChatContext } from "../context/ChatContext";
import { MenuItem } from "./MenuItem";
// import { menuItems as allMenuItems } from "../data/menus/1";
import { useState } from "react";
import { Menu } from "lucide-react";
import { MenuItemFront } from "../types/menu";
import { useRestaurant } from "../context/RestaurantContext";
import { RestaurantCard } from "./RestaurantCard";
import { restroItems } from "../data/restroData";

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
  const [allMenuItems, setAllMenuItems] = useState<MenuItemFront[]>([]);
  const { state: restaurantState } = useRestaurant();

  useEffect(() => {
    async function asyncFn() {
      try {
        if (restaurantState.activeRestroId) {
          const module = await import(
            `../data/menus/${restaurantState.activeRestroId}.ts`
          );
          if (module.menuItems) {
            setAllMenuItems(module.menuItems);
          } else {
            console.error("No menu items found in module");
            setAllMenuItems([]);
          }
        } else {
          setAllMenuItems([]);
        }
      } catch (error) {
        console.error("Error loading menu items:", error);
        setAllMenuItems([]);
      }
    }
    asyncFn();
  }, [restaurantState.activeRestroId]);
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
      let result = state.messages.map((message) => {
        if (message.isBot && message.text) {
          try {
            // Parse the text field into JSON
            console.log(JSON.parse(message.text));
            const parsedText = JSON.parse(message.text);

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
                  restroIds: parsedText.restroIds,
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

  // Function to get menuItems by file number
  async function getMenuItemsByFile(fileNumber: number): Promise<any[]> {
    try {
      // Dynamically import the specific file
      const file = await import(`../data/menus/${fileNumber}.ts`);
      console.log("File loaded:", file); // Debugging

      // Check if the file has menuItems
      if (file.menuItems && Array.isArray(file.menuItems)) {
        console.log(file.menuItems);
        return file.menuItems;
      } else {
        console.error(`File ${fileNumber}.ts does not contain menuItems.`);
        return [];
      }
    } catch (error) {
      console.error(`Error loading file ${fileNumber}.ts:`, error);
      return [];
    }
  }

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

        {/* {state.isLoading && (
          <div className="flex justify-center">
            <img
              src="https://i.pinimg.com/originals/f0/ca/90/f0ca90dd6924e009d86f4421cf2032b5.gif"
              className="h-24"
            />
          </div>
        )} */}
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
                {restroItems.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    id={restaurant.id}
                    name={restaurant.restaurant}
                    description={restaurant.items}
                    image={
                      restaurant.id === 1
                        ? "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop"
                        : restaurant.id === 2
                        ? "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                        : restaurant.id === 3
                        ? "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=1887&auto=format&fit=crop"
                        : restaurant.id === 4
                        ? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
                        : "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=2070&auto=format&fit=crop"
                    }
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
                      image={item.image}
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
