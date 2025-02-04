import React, { useState, useMemo } from "react";
import { useChatContext } from "../context/ChatContext";
import { ChatService } from "../services/chatService";
import { Header } from "./Header";
import { Filters } from "./Filters";
import { ChatPanel } from "./ChatPanel";
import { SlidePanel } from "./SlidePanel";
import { CartSummary } from "./CartSummary";
import { QueryType } from "../context/ChatContext";
import { menuItems } from "../data/menuData";
import { ImageService } from "../services/imageService";
import axios from "axios";
const chatService = new ChatService();
import { saveAs } from "file-saver";
import { restroItems } from "../data/restroData";
import { useRestaurant } from "../context/RestaurantContext";

interface ApiResponse {
  text: string;
  items: { id: number; name: string; price: string }[];
}

export const DunkinOrderApp: React.FC = () => {
  const { state, dispatch } = useChatContext();
  const {
    state: restaurantState,
    setActiveRestaurant,
    setRestaurants,
  } = useRestaurant();
  const [input, setInput] = useState("");
  const [isVegOnly, setIsVegOnly] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);

  // Function to filter data based on age
  const filterData = () => {
    const filtered = menuItems.filter((obj) => obj.restaurant === "Papa Jones");
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "5.json");
  };

  // Replace with your DeepSeek API endpoint and API key
  const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // Example endpoint
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"; // Example endpoint
  const API_KEY = import.meta.env.VITE_PUBLIC_DEEPSEEK_KEY; // Replace with your actual API key
  const OPENAI_KEY = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY; // Replace with your actual API key

  const imageService = new ImageService();

  const handleImageUpload = async (file: File) => {
    // Create local image URL and dispatch user message
    const imageUrl = URL.createObjectURL(file);
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: "Image uploaded",
        isBot: false,
        time: new Date().toLocaleTimeString(),
        imageUrl,
        queryType: QueryType.MENU_QUERY,
      },
    });

    try {
      // Analyze image using OpenAI
      const imageDescription = await imageService.analyzeImage(file);

      const prompt = `Here is the menu data: ${JSON.stringify(
        menuItems
      )}. Based on this image description: "${imageDescription}". Return the response in the format { "text": "", "items": [{ id: number, name: string, price: string }] }, where "text" is a summary and "items" is an array of matching menu items with only id, name, and price. Include a maximum of 6 items and minimum 2 items - but be flexible with items count based on requirements. Do not include any additional text or explanations.`;

      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      // Dispatch bot response
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: response.data.choices[0].message.content,
          isBot: true,
          time: new Date().toLocaleTimeString(),
          queryType: QueryType.MENU_QUERY,
        },
      });
    } catch (error) {
      console.error("Image analysis error:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Sorry, I couldn't analyze the image.",
          isBot: true,
          time: new Date().toLocaleTimeString(),
          queryType: QueryType.GENERAL,
        },
      });
    }
  };

  // Function to get menuItems by file number
  async function getMenuItemsByFile(fileNumber: number): Promise<any[]> {
    try {
      const module = await import(`../data/menus/${fileNumber}.ts`);
      return module.menuItems || [];
    } catch (error) {
      console.error(`Error loading file ${fileNumber}.ts:`, error);
      return [];
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Switch to chat mode if currently in browse mode when starting checkout
    if (state.checkout.step && state.mode === "browse") {
      dispatch({ type: "SET_MODE", payload: "chat" });
    }

    // Handle checkout flow
    if (state.checkout.step) {
      const userMessage = {
        id: Date.now(),
        text: input.trim(),
        isBot: false,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: QueryType.CHECKOUT,
      };
      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

      if (state.checkout.step === "details") {
        if (!state.checkout.orderDetails.name) {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: { name: input.trim() },
          });
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: "Great! What's your delivery address?",
              isBot: true,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType: QueryType.CHECKOUT,
            },
          });
        } else if (!state.checkout.orderDetails.address) {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: { address: input.trim() },
          });
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: "Perfect! And your phone number?",
              isBot: true,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType: QueryType.CHECKOUT,
            },
          });
        } else if (!state.checkout.orderDetails.phone) {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: { phone: input.trim() },
          });
          dispatch({ type: "SET_CHECKOUT_STEP", payload: "payment" });
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: "Great! Now for payment. Please enter your card number:",
              isBot: true,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType: QueryType.CHECKOUT,
            },
          });
        }
      } else if (state.checkout.step === "payment") {
        if (!state.checkout.orderDetails.cardNumber) {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: { cardNumber: input.trim() },
          });
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: "Please enter the card expiry date (MM/YY):",
              isBot: true,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType: QueryType.CHECKOUT,
            },
          });
        } else if (!state.checkout.orderDetails.expiryDate) {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: { expiryDate: input.trim() },
          });
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: "Finally, please enter the CVV:",
              isBot: true,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType: QueryType.CHECKOUT,
            },
          });
        } else if (!state.checkout.orderDetails.cvv) {
          dispatch({
            type: "UPDATE_ORDER_DETAILS",
            payload: { cvv: input.trim() },
          });
          // Process the order
          const total = state.cart
            .reduce(
              (sum, item) => sum + parseFloat(item.price) * item.quantity,
              0
            )
            .toFixed(2);

          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: `Thank you for your order! Your total is $${total}. Your order will be delivered to ${state.checkout.orderDetails.address}. We'll send updates to ${state.checkout.orderDetails.phone}.`,
              isBot: true,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType: QueryType.CHECKOUT,
            },
          });
          // Reset checkout and cart
          dispatch({ type: "SET_CHECKOUT_STEP", payload: null });
        }
      }
      setInput("");
      return;
    }

    // Determine query type
    const queryType = chatService.determineQueryType(input.trim());

    // Create user message with query type
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isBot: false,
      time: new Date().toLocaleTimeString(),
      queryType,
    };

    // Update state
    dispatch({ type: "ADD_MESSAGE", payload: userMessage });
    dispatch({ type: "SET_QUERY_TYPE", payload: queryType });
    setInput("");
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      let apiResponseText = null;
      let restaurant1Menu = [];
      let restaurant2Menu = [];
      let suggestRestroText = "";
      let suggestRestroIds = [];

      if (restaurantState.activeRestroId === null) {
        // Call system prompt if no active restaurant ID
        const systemPrompt = `You are a restaurant recommendation system. Analyze the following restaurant data: ${JSON.stringify(
          restroItems
        )}. Based on the user's query: ${input}, return a response in the format { "text": "", "restroIds": [] }, where "text" is a summary of the user's query and the relevant restaurants, and "restroIds" is an array of restaurant IDs (maximum 2) that match the user's query. Do not include more than 2 restaurant IDs. Do not include any additional text or explanations.`;

        const response = await axios.post(
          OPENAI_API_URL,
          {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: systemPrompt,
              },
            ],
            max_tokens: 500,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_KEY}`,
            },
          }
        );

        apiResponseText = response.data.choices[0].message.content;
        suggestRestroText = JSON.parse(apiResponseText).text;
        suggestRestroIds = JSON.parse(apiResponseText).restroIds;

        if (suggestRestroIds && suggestRestroIds.length > 0) {
          setRestaurants(suggestRestroIds);
          restaurant1Menu = await getMenuItemsByFile(suggestRestroIds[0]);
          if (suggestRestroIds.length > 1) {
            restaurant2Menu = await getMenuItemsByFile(suggestRestroIds[1]);
          }
        }
      } else {
        // If active restaurant ID is available, directly fetch its menu
        restaurant1Menu = await getMenuItemsByFile(
          restaurantState.activeRestroId
        );
      }

      // Construct the menu prompt
      const menuPrompt =
        restaurantState.activeRestroId != null
          ? `You are a menu recommendation system. Analyze the following menu items from restaurants: ${JSON.stringify(
              restaurant1Menu
            )}. Based on the user's query: ${input}, return a response in the format { "text": "", "items1": [{ "id": number, "name": string, "price": string }],"items2": [{ "id": number, "name": string, "price": string }]}, where "text" is a creative information related to user query and the relevant menu items, and "items1" and "item2" are array of menu items ("id", "name", "price") that match the user's query. Include a maximum of 3 items from each relevent restaurant - but be flexible with the item count based on the user's requirements. Do not include any additional text or explanations or format. If 1 menu context then return in items1 only. if 2 menu context then items1, items2 both.Do not add 'json'`
          : `You are a menu recommendation system. Analyze the following menu items from 2 restaurants: ${JSON.stringify(
              restaurant1Menu
            )} and ${JSON.stringify(
              restaurant2Menu
            )}. Based on the user's query: ${input}, return a response in the format { "text": "", "items1": [{ "id": number, "name": string, "price": string }],"items2": [{ "id": number, "name": string, "price": string }]}, where "text" is a creative information related to user query and the relevant menu items, and "items1" and "item2" are array of menu items ("id", "name", "price") that match the user's query. Include a maximum of 3 items from each relevent restaurant - but be flexible with the item count based on the user's requirements. Do not include any additional text or explanations or format. If 1 menu context then return in items1 only. if 2 menu context then items1, items2 both. Do not add 'json'`;

      console.log("suggestRestroIds");
      console.log(suggestRestroIds);
      console.log(restaurantState.activeRestroId);
      if (suggestRestroIds?.length > 0 || restaurantState.activeRestroId) {
        const response2 = await axios.post(
          OPENAI_API_URL,
          {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: menuPrompt,
              },
            ],
            max_tokens: 1000,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_KEY}`,
            },
          }
        );

        const apiResponseText2 = response2.data.choices[0].message.content;
        const botMessage = {
          id: Date.now() + 1,
          text: apiResponseText2,
          isBot: true,
          time: new Date().toLocaleTimeString(),
          queryType,
        };

        dispatch({ type: "ADD_MESSAGE", payload: botMessage });
      } else {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: suggestRestroText,
            isBot: true,
            time: new Date().toLocaleTimeString(),
            queryType: QueryType.GENERAL,
          },
        });
      }
    } catch (error) {
      console.error("Error calling DeepSeek API:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Sorry, I had trouble understanding your question. Please try again.",
          isBot: true,
          time: new Date().toLocaleTimeString(),
          queryType: QueryType.GENERAL,
        },
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Helper function to get appropriate placeholder text based on current query type
  const getInputPlaceholder = () => {
    switch (state.currentQueryType) {
      case QueryType.MENU_QUERY:
        return "Ask about menu items, prices, or place an order...";
      default:
        return "Type your message here...";
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50">
      <div className="relative bg-[#FFF5F2] w-full h-screen max-w-md overflow-hidden flex flex-col">
        <Header
          onOpenPanel={() => setIsPanelOpen(true)}
          onCartClick={() => setIsCartOpen(!isCartOpen)}
          // queryType={state.currentQueryType}
        />

        <Filters
          isVegOnly={isVegOnly}
          setIsVegOnly={setIsVegOnly}
          numberOfPeople={numberOfPeople}
          setNumberOfPeople={setNumberOfPeople}
        />

        <ChatPanel
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          placeholder={getInputPlaceholder()}
          onImageUpload={handleImageUpload}
          isLoading={state.isLoading}
          queryType={state.currentQueryType}
        />
        <CartSummary />
      </div>

      <SlidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        savedAddresses={[]}
        onDeleteAddress={() => {}}
      />

      {/* Cart Summary */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 bg-orange-50 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {state.cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      ${item.price} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_CART_ITEM",
                          payload: {
                            ...item,
                            quantity: Math.max(0, item.quantity - 1),
                          },
                        })
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_CART_ITEM",
                          payload: { ...item, quantity: item.quantity + 1 },
                        })
                      }
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {state.cart.length > 0 ? (
              <div className="p-4 border-t">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">
                    $
                    {state.cart
                      .reduce(
                        (total, item) =>
                          total + parseFloat(item.price) * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    dispatch({ type: "SET_CHECKOUT_STEP", payload: "details" });
                  }}
                  className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Your cart is empty
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
