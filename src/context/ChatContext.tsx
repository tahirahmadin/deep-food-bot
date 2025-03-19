// src/context/ChatContext.tsx
import React, { createContext, useContext, useReducer } from "react";
import { GreetingService } from "../services/greetingService";

export enum QueryType {
  MENU_QUERY = "MENU_QUERY",
  GENERAL = "GENERAL",
  RESTAURANT_QUERY = "RESTAURANT_QUERY",
  CHECKOUT = "CHECKOUT",
  BROWSE = "BROWSE",
  NUTRITION_QUERY = "NUTRITION_QUERY",
  COMBO_QUERY = "COMBO_QUERY"
}

export interface RecommendedItem {
  id: number;
  name: string;
  price?: number;
  description?: string;
  category?: string;
}

export interface ComboMeal {
  id: string;
  name: string;
  items: RecommendedItem[];
  restaurantId: number;
  restaurantName: string;
  totalPrice: number;
  description: string;
}

export enum ChatModel {
  GEMINI = "GEMINI",
  OPENAI = "OPENAI",
  GROQ = "GROQ",
}
interface LLMType {
  restroIds: number[];
  output: OutputType;
}

type OutputType = {
  text: string;
  items1: number[];
  items2: number[];
  restroIds: number[];
};

interface Message {
  id: number;
  text: string;
  llm?: LLMType;
  isBot: boolean;
  time: string;
  imageUrl?: string;
  queryType: QueryType;
  comboMeals?: ComboMeal[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentQueryType: QueryType;

  selectedModel: ChatModel;
  customization: {
    isOpen: boolean;
    item: {
      id: number;
      name: string;
      price: string;
      image?: string;
      customisation?: {
        categories: {
          categoryName: string;
          minQuantity: number;
          maxQuantity: number;
          items: {
            name: string;
            price: number;
            _id: string;
          }[];
          _id: string;
        }[];
        _id: string;
      };
      restaurant?: string;
    } | null;
    isEditing: boolean;
  };
  cart: CartItem[];
  checkout: {
    step: "details" | "payment" | null;
    paymentMethod: "card" | "crypto" | "cash" | null;
    orderDetails: {
      name: string;
      address: string;
      phone: string;
      cardNumber: string;
      expiryDate: string;
      cvv: string;
    };
  };
  currentComboMeals?: ComboMeal[] | null;
}

export interface CartItem {
  id: number;
  name: string;
  price: string;
  description: string;
  quantity: number;
  restaurant: string;
  restaurantId?: number;
  mainItemId?: number;
  items?: RecommendedItem[];
  isCombo?: boolean; 
  customizations?: {
    categoryName: string;
    selection: {
      name: string;
      price: number;
    };
  }[];
  comboId?: string;
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_QUERY_TYPE"; payload: QueryType }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_SELECTED_RESTAURANT"; payload: string | null }
  | { type: "SET_CHAT_MODEL"; payload: ChatModel }
  | { type: "SET_MODE"; payload: "chat" | "browse" }
  | { type: "ADD_TO_CART"; payload: CartItem }
  | {
      type: "SET_CUSTOMIZATION_MODAL";
      payload: { isOpen: boolean; item: ChatState["customization"]["item"] };
    }
  | { type: "REMOVE_FROM_CART"; payload: number }
  | { type: "UPDATE_CART_ITEM"; payload: CartItem }
  | { type: "SET_CHECKOUT_STEP"; payload: "details" | "payment" | null }
  | { type: "SET_PAYMENT_METHOD"; payload: "card" | "crypto" | "cash" }
  | {
      type: "UPDATE_ORDER_DETAILS";
      payload: Partial<ChatState["checkout"]["orderDetails"]>;
    }
  | { type: "CLEAR_CART" }
  | { type: "RESET_STATE" }
  | { type: "SET_CURRENT_COMBO_MEALS"; payload: ComboMeal[] | null }
  | { type: "ADD_COMBO_TO_CART"; payload: ComboMeal };

  const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
    switch (action.type) {
      case "ADD_MESSAGE":
        return {
          ...state,
          messages: [...state.messages, action.payload],
        };
      case "SET_LOADING":
        return {
          ...state,
          isLoading: action.payload,
        };
      case "SET_ERROR":
        return {
          ...state,
          error: action.payload,
        };
      case "SET_QUERY_TYPE":
        return {
          ...state,
          currentQueryType: action.payload,
        };
      case "SET_MODE":
        return {
          ...state,
          mode: action.payload,
        };
      case "SET_CUSTOMIZATION_MODAL":
        return {
          ...state,
          customization: {
            isOpen: action.payload.isOpen,
            item: action.payload.item,
            isEditing: action.payload.isEditing || false,
          },
        };
  
      case "SET_CHAT_MODEL":
        return {
          ...state,
          selectedModel: action.payload,
        };
      case "CLEAR_MESSAGES":
        return {
          ...state,
          messages: [],
        };
      case "ADD_TO_CART":
        const existingItem = state.cart.find(
          (item) => item.id === action.payload.id
        );
        if (existingItem) {
          return {
            ...state,
            cart: state.cart.map((item) =>
              item.id === action.payload.id
                ? { 
                  ...item, 
                  quantity: item.quantity + 1,
                  description: item.description 
                }
                : item
            ),
          };
        }
        return {
          ...state,
          cart: [...state.cart, { ...action.payload, quantity: 1 }],
        };
        case "ADD_COMBO_TO_CART": {
          // Create a cart item from the combo payload
          const newComboCartItem: CartItem = {
            id: Date.now(), 
            comboId: action.payload.id, 
            name: action.payload.name,
            price: action.payload.totalPrice.toFixed(2),
            description: action.payload.description,
            quantity: 1,
            restaurant: action.payload.restaurantName,
            restaurantId: action.payload.restaurantId,
            mainItemId: action.payload.items[0]?.id,
            isCombo: true,
            customizations: action.payload.items.map(item => ({
              categoryName: item.category || "Item",
              selection: {
                name: item.name,
                price: item.price || 0,
                description: item.description
              }
            })),
            // Optionally, pass along the full items array:
            items: action.payload.items,
          };
        
          const existingComboIndex = state.cart.findIndex(item =>
            item.isCombo &&
            item.comboId === action.payload.id &&
            JSON.stringify(item.customizations) === JSON.stringify(newComboCartItem.customizations)
          );
        
          if (existingComboIndex !== -1) {
            const updatedCart = state.cart.map((item, index) => {
              if (index === existingComboIndex) {
                return { ...item, quantity: item.quantity + 1 };
              }
              return item;
            });
            return {
              ...state,
              cart: updatedCart,
            };
          } else {
            return {
              ...state,
              cart: [...state.cart, newComboCartItem],
            };
          }
        }
        
      case "SET_CURRENT_COMBO_MEALS":
        return {
          ...state,
          currentComboMeals: action.payload,
        };
      case "REMOVE_FROM_CART":
        return {
          ...state,
          cart: state.cart.filter((item) => item.id !== action.payload),
        };
      case "UPDATE_CART_ITEM":
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === action.payload.id ? action.payload : item
          ),
        };
      case "SET_CHECKOUT_STEP":
        return {
          ...state,
          checkout: { ...state.checkout, step: action.payload },
        };
      case "SET_PAYMENT_METHOD":
        return {
          ...state,
          checkout: { ...state.checkout, paymentMethod: action.payload },
        };
      case "UPDATE_ORDER_DETAILS":
        return {
          ...state,
          checkout: {
            ...state.checkout,
            orderDetails: {
              ...state.checkout.orderDetails,
              ...action.payload,
            },
          },
        };
      case "CLEAR_CART":
        return {
          ...state,
          cart: [],
        };
      case "RESET_STATE":
        return {
          ...initialState,
          messages: [state.messages[0]], // Keep only the welcome message
        };
      default:
        return state;
    }
  };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  currentQueryType: QueryType.GENERAL,
  mode: "chat",
  selectedModel: ChatModel.OPENAI,
  customization: {
    isOpen: false,
    item: null,
  },
  cart: [],
  checkout: {
    step: null,
    paymentMethod: null,
    orderDetails: {
      name: "",
      address: "",
      phone: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  },
  currentComboMeals: null,
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const greetingService = new GreetingService();
  const greetingUpdated = React.useRef(false);

  React.useEffect(() => {
    const updateGreeting = async () => {
      if (greetingUpdated.current) return;
      greetingUpdated.current = true;

      try {
        const greeting = await greetingService.getGreeting();
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: 1,
            text: greeting,
            isBot: true,
            time: new Date().toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }),
            queryType: QueryType.GENERAL,
          },
        });
      } catch (error) {
        console.error("Error updating greeting:", error);
      }
    };

    updateGreeting();
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
