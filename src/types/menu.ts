export interface SingleRestro {
  id: number;
  restaurant: string;
  items: string;
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
}
