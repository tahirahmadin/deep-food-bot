// src/types/index.ts

// Define the QueryType Enum
export enum QueryType {
  GENERAL_QUERY = "GENERAL_QUERY",
  MENU_QUERY = "MENU_QUERY",
  RESTAURANT_QUERY = "RESTAURANT_QUERY",
  CHECKOUT = "CHECKOUT",
  BROWSE = "BROWSE",
}

type MenuItem = {
  name: string;
  price: string;
  id: number;
};

type StructuredText = {
  text: string;
  items1: MenuItem[];
  items2: MenuItem[];
  restroIds?: number[];
};

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

export interface Message {
  id: number;
  text: string;
  llm?: LLMType;
  isBot: boolean;
  time: string;
  // restroIds: number[];
  image?: string;
  queryType: QueryType;
  imageUrl?: any;
  mealCards?: MenuCard[];
  checkout?: {
    step: "details" | "payment" | "confirmation";
    total?: string;
    items?: any[];
  };
}

export interface MenuCard {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  restaurantId: string | null;
}

export interface Address {
  id: string;
  name: string;
  address: string;
  mobile: string;
  type?: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OrderDetails {
  name: string;
  address: string;
  phone: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}
