// src/context/ChatContext.tsx
import React, { createContext, useContext, useReducer } from "react";

export enum QueryType {
  MENU_QUERY = "MENU_QUERY",
  GENERAL = "GENERAL",
  CHECKOUT = "CHECKOUT",
  BROWSE = "BROWSE",
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  time: string;
  queryType: QueryType;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentQueryType: QueryType;
  mode: "chat" | "browse";
  selectedRestaurant: string | null;
  cart: CartItem[];
  checkout: {
    step: "details" | "payment" | null;
    orderDetails: {
      name: string;
      address: string;
      phone: string;
      cardNumber: string;
      expiryDate: string;
      cvv: string;
    };
  };
}

export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_QUERY_TYPE"; payload: QueryType }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_SELECTED_RESTAURANT"; payload: string | null }
  | { type: "SET_MODE"; payload: "chat" | "browse" }
  | { type: "ADD_TO_CART"; payload: CartItem }
  | { type: "REMOVE_FROM_CART"; payload: number }
  | { type: "UPDATE_CART_ITEM"; payload: CartItem }
  | { type: "SET_CHECKOUT_STEP"; payload: "details" | "payment" | null }
  | {
      type: "UPDATE_ORDER_DETAILS";
      payload: Partial<ChatState["checkout"]["orderDetails"]>;
    }
  | { type: "CLEAR_CART" }
  | { type: "RESET_STATE" };

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
    case "SET_SELECTED_RESTAURANT":
      return {
        ...state,
        selectedRestaurant: action.payload,
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
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }],
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
        checkout: {
          ...state.checkout,
          step: action.payload,
        },
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
        messages: [initialState.messages[0]], // Keep only the welcome message
      };
    default:
      return state;
  }
};

const initialState: ChatState = {
  messages: [
    {
      id: 1,
      text: JSON.stringify({
        text: "Hi! I'm your menu assistant. What would you like to know about our offerings?",
        items1: [],
        items2: [],
      }),

      isBot: true,
      time: new Date().toLocaleTimeString(),
      queryType: QueryType.GENERAL,
    },
  ],
  isLoading: false,
  error: null,
  currentQueryType: QueryType.GENERAL,
  mode: "chat",
  selectedRestaurant: null,
  cart: [],
  checkout: {
    step: null,
    orderDetails: {
      name: "",
      address: "",
      phone: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    },
  },
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
} | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

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
