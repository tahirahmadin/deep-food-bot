import React, { useState, useEffect } from "react";
import { useChatContext } from "../context/ChatContext";
import { ChatService } from "../services/chatService";
import { Header } from "./Header";
import { useToast } from "../context/ToastContext";
import { Toast } from "./Toast";
import { Filters } from "./Filters";
import { ChatPanel } from "./ChatPanel";
import { SlidePanel } from "./SlidePanel";
import { CartSummary } from "./CartSummary";
import { QueryType } from "../context/ChatContext";
import { ImageService } from "../services/imageService";
import axios from "axios";
const chatService = new ChatService();
import { useRestaurant } from "../context/RestaurantContext";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";
import { getRestaurantColors } from "../utils/colorUtils";

export const DunkinOrderApp: React.FC = () => {
  const { toast, hideToast } = useToast();
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, setRestaurants } = useRestaurant();
  const colors = getRestaurantColors(restaurantState.activeRestroId);
  const {
    user,
    setUser,
    isAuthenticated,
    setIsAddressModalOpen,
    addresses,
    orders,
  } = useAuth();
  const { selectedStyle, isVegOnly, isFastDelivery, numberOfPeople } =
    useFiltersContext();
  const [input, setInput] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);

  // Reset UI states when auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setInput("");
      setIsPanelOpen(false);
      setIsCartOpen(false);
    }
  }, [isAuthenticated]);

  // Replace with your DeepSeek API endpoint and API key
  const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // Example endpoint
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"; // Example endpoint
  const GROQ_API_URL = "https://api.groq.com/v1/chat/completions"; // Example endpoint

  const API_KEY = import.meta.env.VITE_PUBLIC_DEEPSEEK_KEY; // Replace with your actual API key
  const OPENAI_KEY = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY; // Replace with your actual API key
  const GROQ_KEY = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY; // Replace with your actual API key

  const imageService = new ImageService();

  const handleImageUpload = async (file: File) => {
    setIsImageAnalyzing(true);
    // Create local image URL and dispatch user message
    const imageUrl = URL.createObjectURL(file);
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: "Image uploaded",
        isBot: false,
        time: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        imageUrl,
        queryType: QueryType.MENU_QUERY,
      },
    });

    try {
      const imageDescription = await imageService.analyzeImage(file);
      const { restaurants } = restaurantState;
      const prompt = `
      You are a menu recommendation system.

      Here are the only restaurants you can recommend:
      ${JSON.stringify(restaurants)}

      Analyze the image description: "${imageDescription}"
      and return exactly one JSON object:
      {
        "text": "",
        "restroIds": [],
      }
      Where:
      - "text" is a short, relevant response about recommended foods from these restaurants and why it was recommended based on image.
      - "restroIds" is an array (up to 2) of the restaurant IDs you choose from the above list.
      - NO invented restaurants or items. Only use what's in the above data.
      
      STRICT FORMAT RULES:
      - Return ONLY a valid JSON object. No code fences, disclaimers, or extra text.
    `;

      const pickResp = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
        }
      );

      let pickParsed;
      try {
        pickParsed = JSON.parse(
          pickResp.data.choices[0].message.content || "{}"
        );
      } catch (err) {
        pickParsed = { text: "Couldn’t parse restaurant picks", restroIds: [] };
      }
      const suggestRestroIds = pickParsed.restroIds || [];
      let restaurant1Menu: any[] = [];
      let restaurant2Menu: any[] = [];

      if (suggestRestroIds.length >= 1) {
        restaurant1Menu = await getMenuItemsByFile(suggestRestroIds[0]);
      }
      if (suggestRestroIds.length >= 2) {
        restaurant2Menu = await getMenuItemsByFile(suggestRestroIds[1]);
      }

      const twoMenusPrompt = `
        You are a menu recommendation system.
        
        We have two restaurants:
        - Restaurant #${suggestRestroIds[0]}: ${JSON.stringify(
        restaurant1Menu
      )} 
        - Restaurant #${suggestRestroIds[1]}: ${JSON.stringify(restaurant2Menu)}
        
        Analyze the same image description: "${imageDescription}"
        Return exactly one JSON:
        {
          "text": "",
          "items1": [],
          "items2": []
        }
        Where:
        - "text" is a short, clever and funny response about recommended foods from these restaurants and why it was recommended based on image in 10-15 words.
        - "items1": up to 3 items (id/name) from Restaurant #${
          suggestRestroIds[0]
        }'s array
        - "items2": up to 3 items from Restaurant #${
          suggestRestroIds[1]
        }'s array.
        - If we only have one recommended restaurant, keep items2 = []
        - No invented items. Only use the arrays we gave you.
        - If nothing is relevant, keep items1 and items2 empty but still fill "text".
        - NO invented restaurants or items. Only use what's in the above data.
        
        STRICT FORMAT RULES:
        - Only valid JSON. No code fences or disclaimers.
        `;
      const twoMenusResp = await axios.post(
        OPENAI_API_URL,
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: twoMenusPrompt }],
          max_tokens: 1000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
        }
      );

      let itemsParsed;
      try {
        itemsParsed = JSON.parse(
          twoMenusResp.data.choices[0].message.content || "{}"
        );
      } catch (err) {
        itemsParsed = { text: "Couldn’t parse items", items1: [], items2: [] };
      }

      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 2,
          text: itemsParsed.text || "No items found",
          llm: {
            output: itemsParsed,
            restroIds: suggestRestroIds,
          },
          isBot: true,
          time: new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.MENU_QUERY,
        },
      });
    } catch (error) {
      console.error("Image handle error:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 999,
          text: "Sorry, I couldn't analyze the image or fetch items.",
          isBot: true,
          time: new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.GENERAL,
        },
      });
    } finally {
      setIsImageAnalyzing(false);
    }
  };

  // Function to get menuItems by file number
  async function getMenuItemsByFile(restaurantId: number): Promise<any[]> {
    return await getMenuByRestaurantId(restaurantId, restaurantState, dispatch);
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
    const queryType = chatService.determineQueryType(
      input.trim(),
      restaurantState.activeRestroId
    );

    // Create user message with query type
    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isBot: false,
      time: new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
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
      let activeMenu = [];
      let suggestRestroText = "";
      let suggestRestroIds = [];
      let orderContextRestro = "";
      let orderContextItem = "";

      const { activeRestroId, restaurants } = restaurantState;

      let restaurantContext = restaurants.map((ele) => {
        return {
          menuSummary: ele.menuSummary,
          name: ele.name,
          description: ele.description,
          id: ele.id,
        };
      });

      orderContextItem = [
        ...new Set(
          orders?.flatMap((ele) => ele.items?.map((itemObj) => itemObj.name)) ||
            []
        ),
      ].join(", ");

      console.log("orderContext");
      console.log(orderContextItem);

      const summary = getConversationSummary(state.messages);
      console.log("summary");
      console.log(summary);

      if (!activeRestroId) {
        // SYSTEM PROMPT: Get recommended restaurants based on user query
        const systemPrompt = `
          You are a restaurant recommendation system.
          Given the following restaurants: ${JSON.stringify(restaurantContext)},
          analyze the user's query: "${input}" and also consider his previous order choices from ${orderContextItem}
          and return exactly one JSON object:
            {
              "text": "",
              "restroIds": []
            }
          where:
            - "text" is a short, relevant response.
            - "restroIds" is an array of up to 2 matching restaurant IDs (numeric).

          STRICT FORMAT RULES:
            - Return only a valid JSON object with no extra text, explanations, or markdown.
            - No code fences, no trailing commas, no disclaimers.
            - Only return a valid JSON object, nothing else.
        `;

        const response = await axios.post(
          OPENAI_API_URL,
          {
            model: "gpt-4o",
            messages: [{ role: "user", content: systemPrompt }],
            max_tokens: 500,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_KEY}`,
            },
          }
        );

        const parsedResponse = JSON.parse(
          response.data.choices[0].message.content
        );
        suggestRestroText = parsedResponse.text;
        suggestRestroIds = parsedResponse.restroIds;

        if (queryType === QueryType.RESTAURANT_QUERY) {
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: suggestRestroText,
              llm: {
                output: {
                  text: suggestRestroText,
                  items1: [],
                  items2: [],
                  restroIds: [],
                },
                restroIds: suggestRestroIds,
              },

              isBot: true,
              time: new Date().toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType,
            },
          });
          return;
        }
        if (suggestRestroIds.length > 0) {
          setRestaurants(suggestRestroIds);
          restaurant1Menu = await getMenuItemsByFile(suggestRestroIds[0]);
          if (suggestRestroIds.length > 1) {
            restaurant2Menu = await getMenuItemsByFile(suggestRestroIds[1]);
          }
        }
      } else {
        // Fetch active restaurant menu
        activeMenu = await getMenuItemsByFile(activeRestroId);
      }

      // Build instruction string for menu filtering
      let instructionString = "";
      if (isVegOnly) instructionString += " Provide only VEGETARIAN options.";
      if (numberOfPeople > 1)
        instructionString += ` Show portions sufficient for ${numberOfPeople} people.`;

      // MENU PROMPT: Fetch menu items based on user query
      const menuPrompt = `
      You are a menu recommendation system.
      Given the menu items from ${
        activeRestroId ? "a restaurant" : "two restaurants"
      }:
      ${
        activeRestroId
          ? JSON.stringify(activeMenu)
          : JSON.stringify(restaurant1Menu) +
            " and " +
            JSON.stringify(restaurant2Menu)
      },
      analyze the user's query: "${input}" and also consider his previous order choices from ${orderContextItem}
      and return a JSON response: 
      ${
        activeRestroId
          ? `{ "text": "", "items1": [{ "id": number, "name": string }] }`
          : `{ "text": "", "items1": [{ "id": number, "name": string }], "items2": [{ "id": number, "name": string }] }`
      } 
      where:
        - "text" provides a concise and creative response in ${
          selectedStyle.name
        } style.
        - ${
          activeRestroId
            ? `"items1" contains up to 3 recommended items.`
            : `"items1" and "items2" contain up to 3 relevant items each from their respective restaurant menus.`
        }
        - Adjust the number of items based on user requirements.
        - If no matching items are found, return a valid response with empty arrays.
      STRICT FORMAT RULES:
        - DO NOT include any markdown formatting.
        - DO NOT include explanations or additional text before or after the JSON.
        - Only return a valid JSON object, nothing else.
    `;

      if (suggestRestroIds.length > 0 || activeRestroId) {
        const menuResponse = await axios.post(
          OPENAI_API_URL,
          {
            model: "gpt-4o",
            messages: [{ role: "user", content: menuPrompt }],
            max_tokens: 1000,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_KEY}`,
            },
          }
        );

        const parsedMenuResponse = JSON.parse(
          menuResponse.data.choices[0].message.content
        );

        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: parsedMenuResponse.text,
            llm: {
              output: parsedMenuResponse,
              restroIds: activeRestroId ? [activeRestroId] : suggestRestroIds,
            },

            isBot: true,
            time: new Date().toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }),
            queryType,
          },
        });
      } else {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: suggestRestroText,
            isBot: true,
            time: new Date().toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }),
            queryType: QueryType.GENERAL,
          },
        });
      }
    } catch (error) {
      console.error("Error processing AI response:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 1,
          text: "Sorry, I had trouble understanding your question. Please try again.",
          isBot: true,
          time: new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.GENERAL,
        },
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  function getConversationSummary(messages) {
    return messages
      .filter((msg) => !msg.isBot || msg.llm?.output) // Keep user messages and bot messages with suggestions
      .map((msg) => {
        if (msg.isBot && msg.llm?.output) {
          // Extract relevant bot response text and suggested items
          const items = [
            ...new Set([
              ...(msg.llm.output.items1?.map((item) => item.name) || []),
              ...(msg.llm.output.items2?.map((item) => item.name) || []),
            ]),
          ].join(", ");

          return `Bot: ${msg.llm.output.text} (Suggested: ${items})`;
        }
        return `${msg.isBot ? "Bot" : "User"}: ${msg.text}`;
      })
      .join("\n");
  }

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
    <div className="min-h-[100vh] h-[100vh] relative flex items-center justify-center bg-gray-50 overflow-hidden">
      <div
        className="relative w-full h-full max-w-md transition-colors duration-300"
        style={{ backgroundColor: colors }}
      >
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}

        <div className="fixed top-0 left-0 right-0 z-[50] bg-[#FFF5F2] max-w-md mx-auto">
          <Header
            onOpenPanel={() => setIsPanelOpen(true)}
            onCartClick={() => setIsCartOpen(!isCartOpen)}
          />
          <Filters />
        </div>
        <div className="h-full pt-[160px] pb-15">
          <ChatPanel
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            placeholder={getInputPlaceholder()}
            onImageUpload={handleImageUpload}
            isImageAnalyzing={isImageAnalyzing}
            isLoading={state.isLoading}
            queryType={state.currentQueryType}
          />
        </div>
        <CartSummary />
      </div>

      <SlidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />

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
                    // Set order details from the first address
                    if (addresses.length > 0) {
                      dispatch({
                        type: "UPDATE_ORDER_DETAILS",
                        payload: {
                          name: addresses[0].name,
                          address: addresses[0].address,
                          phone: addresses[0].mobile,
                        },
                      });
                      // Go directly to payment
                      dispatch({
                        type: "SET_CHECKOUT_STEP",
                        payload: "payment",
                      });
                    } else {
                      setIsAddressModalOpen(true);
                    }
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
