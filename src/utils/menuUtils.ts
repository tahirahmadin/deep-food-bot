import { MenuItemWithImage } from "../data/menuDataFront";

export const findMenuItemById = (id: number) => {
  return MenuItemWithImage.find((item) => item.id === id);
};

export const getRestaurantNameById = (
  restaurants: any[],
  id: number
): string => {
  const restaurant = restaurants.find((item) => item.restaurantId === id);
  return restaurant ? restaurant.name : "Restaurant";
};
