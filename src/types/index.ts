// src/types/index.ts

// Define the QueryType Enum
export enum QueryType {
  GENERAL_QUERY = "GENERAL_QUERY",
  MENU_QUERY = "MENU_QUERY",
}

type MenuItem = {
  name: string;
  price: string;
};

type StructuredText = {
  text: string;
  items: MenuItem[];
};

export interface Message {
  id: number;
  text: string; // Made optional
  isBot: boolean;
  time: string;
  image?: string;
  mealCards?: MenuCard[];
  queryType: "GENERAL" | "MENU_QUERY";
  structuredText?: StructuredText; // Optional for non-MENU_QUERY types
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
  phone: string;
}

export interface OrderDetails {
  name: string;
  address: string;
  phone: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}
