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
import { MapPin } from "lucide-react";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { loginUserFromBackendServer } from "../actions/serverActions";

interface ChatPanelProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  onImageUpload: (file: File) => void;
  isImageAnalyzing: boolean;
  isLoading?: boolean;
  queryType?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  input,
  setInput,
  onSubmit,
  onImageUpload,
  isImageAnalyzing,
  placeholder,
  isLoading = false,
}) => {
  const { state } = useChatContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allMenuItems, setAllMenuItems] = useState<MenuItemFront[]>([]);
  const { state: restaurantState, dispatch: restaurantDispatch } =
    useRestaurant();
  const { addresses, setIsAddressModalOpen, isAuthenticated, setUser } =
    useAuth();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }
        );

        const loginResponse = await loginUserFromBackendServer(
          "GMAIL",
          userInfo.data.email
        );

        if (loginResponse.error) {
          throw new Error("Backend login failed");
        }

        setUser({
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          userId: loginResponse.result._id,
        });
      } catch (error) {
        console.error("Login error:", error);
        alert("Failed to sign in. Please try again.");
      }
    },
    onError: () => {
      console.error("Login Failed");
      alert("Login failed. Please try again.");
    },
  });

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
  // const cleanMessages = useMemo(() => {
  //   if (state.messages?.length > 0) {
  //     let result = state.messages.map((message) => {
  //       if (message.isBot && message.text) {
  //         try {
  //           // Parse the text field into JSON
  //           const parsedText = JSON.parse(message.text);
  //           console.log("parsedText");
  //           console.log(parsedText);
  //           // Validate the JSON structure
  //           if (
  //             parsedText &&
  //             typeof parsedText === "object" &&
  //             "text" in parsedText &&
  //             "items1" in parsedText
  //           ) {
  //             // Restructure the message object
  //             return {
  //               id: message.id,
  //               isBot: message.isBot,
  //               time: message.time,
  //               restroIds: message.restroIds,
  //               text: message.text,
  //               queryType: message.queryType,
  //               structuredText: {
  //                 text: parsedText.text,
  //                 items1: parsedText.items1,
  //                 items2: parsedText.items2,
  //               },
  //             };
  //           }
  //         } catch (error) {
  //           console.log("Failed to parse message as JSON:", error);
  //           return message;
  //         }
  //         // If JSON parsing fails or validation fails, return the original message
  //         return message;
  //       } else {
  //         return message;
  //       }
  //     });

  //     return result;
  //   } else {
  //     return [];
  //   }
  // }, [state.messages]);

  // const cleanMessages = useMemo(() => {
  //   if (state.messages?.length > 0) {
  //     let result = state.messages.map((message) => {
  //       if (message.isBot && message.text) {
  //         try {
  //           // Parse the text field into JSON
  //           return {
  //             id: message.id,
  //             isBot: message.isBot,
  //             time: message.time,
  //             restroIds: message.restroIds,
  //             text: message.text,
  //             queryType: message.queryType,
  //             structuredText: {
  //               text: message.text.text,
  //               items1: message.text.items1,
  //               items2: message.text.items2,
  //             },
  //           };
  //         } catch (error) {
  //           console.log("Failed to parse message as JSON:", error);
  //           return message;
  //         }
  //         // If JSON parsing fails or validation fails, return the original message
  //         return message;
  //       } else {
  //         return message;
  //       }
  //     });

  //     return result;
  //   } else {
  //     return [];
  //   }
  // }, [state.messages]);

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
        className={`flex-1 overflow-y-auto p-2 bg-white/30 backdrop-blur-sm scroll-smooth relative ${
          state.mode === "browse" ? "hidden" : ""
        }`}
        ref={chatContainerRef}
      >
        {!isAuthenticated && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full mx-4 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Sign In Required
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please sign in to start chatting and ordering with us.
              </p>
              <button
                onClick={() => {
                  login();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        )}
        {isAuthenticated && addresses.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full mx-4 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Add Delivery Address
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please add your delivery address to start ordering and chatting
                with us.
              </p>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
              >
                Add Address
              </button>
            </div>
          </div>
        )}
        {state.messages.map((message) => (
          <Message key={message.id} message={message} onRetry={() => {}} />
        ))}

        {isImageAnalyzing && (
          <div className="flex items-center space-x-2 text-gray-500">
            <span
              className="font-sans animate-pulse inline-block ml-4"
              style={{ transform: "skew(-10deg)" }}
            >
              Analyzing image
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
                    image={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurant.id}/${restaurant.id}-0.jpg`}
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
                      restaurant={
                        state.selectedRestaurant ? state.selectedRestaurant : ""
                      }
                      image={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restaurantState.activeRestroId}/${restaurantState.activeRestroId}-${item.id}.jpg`}
                      quantity={0}
                      isCustomisable={item.isCustomisable}
                      customisation={item.customisation}
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
