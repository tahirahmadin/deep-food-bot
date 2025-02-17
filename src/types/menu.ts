export interface SingleRestro {
  id: number;
  name: string;
  menuSummary: string;
  description: string;
  items: string;
  bscBaseDepositAddress: string;
  stripeAccountId: string;
}
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string | null;
  price: string;
  spicinessLevel: number;
  sweetnessLevel: number;
  dietaryPreference: string[];
  healthinessScore: number;
  popularity: number;
  caffeineLevel: string;
  sufficientFor: number;
}

export interface MenuItemFront {
  id: number;
  name: string;
  description: string;
  category: string | null;
  price: string;
  restaurant: string;
  image: string;
  spicinessLevel: number;
  sweetnessLevel: number;
  dietaryPreference: string[];
  healthinessScore: number;
  popularity: number;
  caffeineLevel: string;
  sufficientFor: number;
  isCustomisable?: boolean;
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
}
