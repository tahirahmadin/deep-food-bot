import { MenuItemWithImage } from "../data/menuDataFront";
import { restroItems } from "../data/restroData";

export const findMenuItemById = (id: number) => {
  return MenuItemWithImage.find((item) => item.id === id);
};

export const getRestaurantNameById = (id: number): string => {
  const restaurant = restroItems.find((item) => item.id === id);
  return restaurant ? restaurant.restaurant : "Unknown Restaurant";
};
