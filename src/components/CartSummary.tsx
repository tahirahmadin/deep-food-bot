import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Plus, Minus, X, Activity, BarChart } from "lucide-react";
import { useChatContext, QueryType } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId, getRestaurantNameById } from "../utils/menuUtils";
import { useAuth } from "../context/AuthContext";
import { useFiltersContext } from "../context/FiltersContext";
import { useChatLogic } from "./chat/ChatLogic";
import CartNutritionCard from "./CartNutritionCard";
import { generateLLMResponse } from "../actions/serverActions";

interface NutritionCacheEntry {
  data: any;
  timestamp: number;
}

const NUTRITION_CACHE_TTL = 30 * 60 * 1000;

export const CartSummary: React.FC = () => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState } = useRestaurant();
  const { isAuthenticated, addresses, setIsAddressModalOpen } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const { theme } = useFiltersContext();
  const [selectedItemForNutrition, setSelectedItemForNutrition] = useState<number | null>(null);
  const [isViewingCombinedNutrition, setIsViewingCombinedNutrition] = useState(false);
  const [nutritionData, setNutritionData] = useState<any | null>(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState<boolean>(false);
  
  // Nutrition cache ref to persist between renders
  const nutritionCacheRef = useRef<{
    itemCache: Map<string, NutritionCacheEntry>;
    combinedCache: Map<string, NutritionCacheEntry>;
  }>({
    itemCache: new Map(),
    combinedCache: new Map(),
  });

  const { dispatch: restaurantDispatch } = useRestaurant();
  
  // Get the ChatLogic functions
  const chatLogic = useChatLogic({
    input: "",
    restaurantState,
    restaurantDispatch,
    state,
    dispatch,
    orders: [],
    selectedStyle: { name: "concise" },
    isVegOnly: false,
    numberOfPeople: 1,
    setRestaurants: () => {},
    addresses,
    chatHistory: state.messages,
  });

  useEffect(() => {
    const fetchMenuItems = async () => {
      if (
        restaurantState.activeRestroId &&
        !restaurantState.menus[restaurantState.activeRestroId]
      ) {
        const items = await getMenuByRestaurantId(
          restaurantState.activeRestroId,
          restaurantState,
          restaurantDispatch
        );
        setMenuItems(
          restaurantState.menus[restaurantState.activeRestroId] || []
        );
      }
    };
    fetchMenuItems();
  }, [restaurantState.activeRestroId, restaurantState, restaurantDispatch]);

  const cartTotal = React.useMemo(() => {
    return state.cart
      .reduce((total, item) => {
        return total + parseFloat(item.price) * item.quantity;
      }, 0)
      .toFixed(2);
  }, [state.cart]);

  const updateQuantity = (
    itemId: number,
    name: string,
    price: string,
    change: number
  ) => {
    const item = state.cart.find((i) => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity <= 0) {
        dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
      } else {
        dispatch({
          type: "UPDATE_CART_ITEM",
          payload: { id: itemId, name, price, quantity: newQuantity },
        });
      }
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsExpanded(false);
      return;
    }

    if (state.cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (addresses.length === 0) {
      alert("Please add a delivery address first");
      setIsExpanded(false);
      setIsAddressModalOpen(true);
      return;
    }

    if (state.mode === "browse") {
      dispatch({ type: "SET_MODE", payload: "chat" });
    }

    // Set default payment method to card
    dispatch({ type: "SET_PAYMENT_METHOD", payload: "card" });
    setIsExpanded(false);
    // Add order details message with summary card
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now() + 1,
        text: JSON.stringify({
          orderSummary: {
            items: state.cart.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            total: cartTotal,
            restaurant: state.selectedRestaurant,
          },
        }),
        isBot: true,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        queryType: "CHECKOUT",
      },
    });
    dispatch({
      type: "UPDATE_ORDER_DETAILS",
      payload: {
        name: addresses[0].name,
        address: addresses[0].address,
        phone: addresses[0].mobile,
      },
    });
  };
  
  // Updated function: try activeRestroId, then fallback to first cart item's restaurantId
  const getActiveRestaurantName = (): string => {
    if (restaurantState.activeRestroId) {
      const name = getRestaurantNameById(
        restaurantState.restaurants,
        restaurantState.activeRestroId
      );
      if (name && name !== "Unknown Restaurant") return name;
    }
    if (state.cart.length > 0 && state.cart[0].restaurantId) {
      const fallbackName = getRestaurantNameById(
        restaurantState.restaurants,
        state.cart[0].restaurantId
      );
      if (fallbackName && fallbackName !== "Unknown Restaurant") return fallbackName;
    }
    return state.selectedRestaurant || "";
  };

  const getComboImageUrl = (cartItem: any) => {
    const mainItemId = cartItem.mainItemId;
    if (mainItemId) {
      return `${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${cartItem.restaurantId}/${cartItem.restaurantId}-${mainItemId}.jpg`;
    }
    return "";
  };
  
  const getCombinedCacheKey = (): string => {
    const restaurantName = getActiveRestaurantName();
    // Prefix combo items with "Combo:" so they’re clearly identified.
    const itemsKey = state.cart
      .map(item => {
        const prefix = item.isCombo ? "Combo:" : "";
        return `${prefix}${item.name}:${item.quantity}`;
      })
      .sort()
      .join('|');
    return `${restaurantName}:combined:${itemsKey}`;
  };
  
  const isCacheValid = (entry: NutritionCacheEntry | undefined): boolean => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < NUTRITION_CACHE_TTL;
  };
  
  const getCombinedNutritionInfo = async () => {
    setIsLoadingNutrition(true);
    setSelectedItemForNutrition(null);
    setIsViewingCombinedNutrition(true);
    
    try {
      const cacheKey = getCombinedCacheKey();
      const cachedEntry = nutritionCacheRef.current.combinedCache.get(cacheKey);
      
      if (isCacheValid(cachedEntry)) {
        console.log(`Using cached combined nutrition data`);
        setNutritionData(cachedEntry.data);
        setIsLoadingNutrition(false);
        return;
      }
      
      const userDailyCalories = state.userPreferences?.dailyCalories || 2000;
      
      const calculateReferenceValues = (calories: number) => {
        const ratio = calories / 2000;
        return {
          calories: calories,
          protein: Math.round(50 * ratio),
          carbs: Math.round(300 * ratio),
          fat: Math.round(65 * ratio),
          saturatedFat: Math.round(20 * ratio),
          fiber: Math.round(25 * ratio),
          sugar: Math.round(25 * ratio),
          sodium: 2300
        };
      };
      
      const referenceValues = calculateReferenceValues(userDailyCalories);
      
      const restaurantName = getActiveRestaurantName();
      
      const itemsList = state.cart.map(item => {
        const prefix = item.isCombo ? "Combo: " : "";
        const itemDetails = `${prefix}${item.name} (x${item.quantity})`;
        return item.description ? `${itemDetails} - ${item.description}` : itemDetails;
      }).join("; ");
      
      let nutritionContext = "";
      if (restaurantName) {
        nutritionContext += `Restaurant Name: ${restaurantName}. `;
      }
      nutritionContext += `Food Items: ${itemsList}. `;
      nutritionContext += "Provide the combined nutritional information for all these items together as a complete meal. If specific nutritional information is not available, provide approximate values that are nearly accurate.";
      
      const nutritionPrompt = `
      You are a nutrition assistant. Provide comprehensive combined nutritional information for the multiple food items mentioned.
      ${nutritionContext}
  
      Important: The user follows a ${userDailyCalories} calorie diet. Please scale your nutritional assessment accordingly.
  
      Format the response as a JSON object exactly as follows:
      {
        "text": "Your Answer",
        "item": "Total Meal",
        "calories": number,
        "totalFat": number,
        "saturatedFat": number,
        "protein": number,
        "carbs": number,
        "fiber": number,
        "sugar": number,
        "sodium": number,
        "isVegetarian": boolean,
        "isLowCalorie": boolean,
        "isHighProtein": boolean,
        "referenceValues": {
          "calories": ${referenceValues.calories},
          "protein": ${referenceValues.protein},
          "carbs": ${referenceValues.carbs},
          "fat": ${referenceValues.fat},
          "saturatedFat": ${referenceValues.saturatedFat},
          "fiber": ${referenceValues.fiber},
          "sugar": ${referenceValues.sugar},
          "sodium": ${referenceValues.sodium}
        }
      }
  
      where:
        - "text" provides a brief summary about the combined nutritional value of all items.
        - All nutrition values should be the combined values for all items accounting for quantities.
        - "isVegetarian" should be true only if ALL items are vegetarian.
        - "isLowCalorie" should be true if the total calories are fewer than ${Math.round(userDailyCalories * 0.4)} calories.
        - "isHighProtein" should be true if the total protein is more than ${Math.round(referenceValues.protein * 0.5)} grams.
  
        STRICT FORMAT RULES:
        - DO NOT include any markdown formatting.
        - DO NOT include explanations or additional text.
        - DO NOT include any special character, format before and after the json.
        - Only return a valid JSON object, nothing else.
        - Ensure all values represent the COMBINED nutritional values of all items.
      `;
  
      const response = await generateLLMResponse(
        nutritionPrompt,
        300,
        state.selectedModel,
        0.5
      );
      
      nutritionCacheRef.current.combinedCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      setNutritionData(response);
    } catch (error) {
      console.error("Error fetching combined nutrition info:", error);
    } finally {
      setIsLoadingNutrition(false);
    }
  };
  
  useEffect(() => {
    nutritionCacheRef.current.combinedCache.clear();
  }, [state.cart]);
  
  const closeNutritionCard = () => {
    setSelectedItemForNutrition(null);
    setIsViewingCombinedNutrition(false);
    setNutritionData(null);
  };

  const getItemImageUrl = (itemId: number, fallbackRestaurant?: number) => {
    const restro = restaurantState.activeRestroId || fallbackRestaurant;
    return `${import.meta.env.VITE_PUBLIC_AWS_BUCKET_URL}/${restro}/${restro}-${itemId}.jpg`;
  };

  if (state.cart.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-2">
      <div className="flex flex-col items-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2 py-2 text-white rounded-full transition-all shadow-lg mb-2"
          style={{
            backgroundColor: theme.primary,
            color: theme.background,
          }}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="font-medium text-xs">{cartTotal} AED</span>
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              color: theme.primary,
              backgroundColor: theme.background,
            }}
          >
            {state.cart.length}
          </span>
        </button>

        {isExpanded && (
          <div
            className="rounded-lg shadow-xl w-full overflow-hidden animate-slide-up relative"
            style={{ backgroundColor: theme.modalBg }}
          >
            {/* Nutrition card overlay */}
            {(selectedItemForNutrition !== null || isViewingCombinedNutrition) && (
              <div 
                className="absolute inset-0 z-10 rounded-lg overflow-hidden flex flex-col"
                style={{ backgroundColor: theme.modalBg }}
              >
                <div 
                  className="px-4 py-3 flex justify-between items-center"
                  style={{ 
                    backgroundColor: theme.modalBgLight,
                    color: theme.modalMainText,
                    borderBottom: `1px solid ${theme.cardHighlight}30`
                  }}
                >
                  <h3 className="font-semibold text-sm"
                  style={{ color: theme.modalSecondText }}>
                    {isViewingCombinedNutrition ? "Total Nutrition Information" : "Nutrition Information"}
                  </h3>
                  <button 
                    onClick={closeNutritionCard} 
                    className="p-1 rounded-full hover:bg-gray-200/50"
                  >
                    <X className="w-4 h-4" style={{ color: theme.modalSecondText }} />
                  </button>
                </div>
                
                {/* Content area */}
                <div className="flex-1 overflow-hidden">
                  {isLoadingNutrition ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="w-10 h-10 border-t-2 border-b-2 rounded-full animate-spin mb-3" style={{ borderColor: theme.primary }}></div>
                      <p className="text-sm" style={{ color: theme.modalMainText }}>
                        {isViewingCombinedNutrition 
                          ? "Calculating total nutritional content..." 
                          : "Analyzing nutritional content..."}
                      </p>
                    </div>
                  ) : nutritionData ? (
                    <CartNutritionCard 
                      nutritionData={nutritionData} 
                      onClose={closeNutritionCard}
                      itemImage={selectedItemForNutrition ? getItemImageUrl(selectedItemForNutrition) : null}
                      showHeader={false} 
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                      <div className="text-center">
                        <p className="text-sm mb-4" style={{ color: theme.modalMainText }}>Could not retrieve nutrition information</p>
                        <button
                          onClick={closeNutritionCard}
                          className="px-4 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: theme.primary,
                            color: 'white'
                          }}
                        >
                          Back to Cart
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Regular cart view */}
            <div
              className="px-4 py-2 flex justify-between items-center border-b p-3 border-b"
              style={{ backgroundColor: theme.modalBgLight }}
            >
              <h3
                className="font-semibold "
                style={{ color: theme.modalSecondText }}
              >
                Your Cart
              </h3>
              <X
                style={{ color: theme.modalSecondText }}
                className="w-4 h-4 text-gray-500 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
            {state.cart.map((item) => {
              const isCombo = item.isCombo === true;
              const imageUrl = isCombo && item.mainItemId
                ? getComboImageUrl(item)
                : getItemImageUrl(item.id, item.restaurantId);
              console.log("Computed imageUrl:", imageUrl);

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 border-b"
                  >
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4
                          className="font-medium text-xs truncate"
                          style={{
                            color: theme.modalMainText,
                          }}
                        >
                          {item.name}
                        </h4>
                      </div>
                      <div className="mt-0.5">
                        {item.customizations?.map((customization, index) => (
                          <div
                            key={index}
                            className="text-[10px] text-gray-500"
                          >
                            <span className="font-semibold text-gray-500">
                              {customization.categoryName}:
                            </span>{" "}
                            {customization.selection.name}
                            {customization.selection.price > 0 && (
                              <span
                                className="ml-1 opacity-80"
                                style={{
                                  color: theme.modalMainText,
                                }}
                              >
                                (+{customization.selection.price} AED)
                              </span>
                            )}
                          </div>
                        ))}
                        {/* Hide Edit button for combo items */}
                        {!isCombo &&
                          item.customizations &&
                          item.customizations.length > 0 && (
                            <button
                              onClick={() =>
                                dispatch({
                                  type: "SET_CUSTOMIZATION_MODAL",
                                  payload: {
                                    isOpen: true,
                                    item,
                                    isEditing: true,
                                  },
                                })
                              }
                              className="text-grey-400 font-bold text-xs mt-1"
                            >
                              Edit ▶
                            </button>
                          )}
                      </div>
                      <p
                        className="text-xs opacity-70"
                        style={{
                          color: theme.modalMainText,
                        }}
                      >
                        {item.price} AED
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.name, item.price, -1)
                        }
                        className={`p-1 rounded-full`}
                        style={{
                          backgroundColor: theme.modalBg,
                          ":hover": { backgroundColor: theme.modalBgLight },
                        }}
                      >
                        <Minus
                          className="w-4 h-4"
                          style={{ color: theme.chatBubbleBg }}
                        />
                      </button>
                      <span
                        className="text-sm font-medium w-6 text-center"
                        style={{ color: theme.modalMainText }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.name, item.price, 1)
                        }
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Plus
                          className="w-4 h-4"
                          style={{ color: theme.chatBubbleBg }}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="p-4 border-t"
              style={{
                backgroundColor: theme.modalBg,
                color: theme.modalMainText,
              }}
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total</span>
                <span className="font-bold">{cartTotal} AED</span>
              </div>
              
              {/* Combined nutrition button */}
              <button
                onClick={getCombinedNutritionInfo}
                className="w-full mb-2 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: `${theme.cardHighlight}20`,
                  color: theme.primary
                }}
              >
                <BarChart className="w-4 h-4" />
                <span className="font-medium">View Total Nutritional Info</span>
              </button>
              
              <button
                onClick={handleCheckout}
                className="w-full py-2 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme.chatBubbleBg,
                  color: theme.chatBubbleText,
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
