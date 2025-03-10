import { getRestaurantMenu } from "../actions/serverActions";

export const getMenuByRestaurantId = async (
  restaurantId: number,
  state: any,
  dispatch: any
): Promise<any[]> => {
  // Check if menu exists in context
  if (state.menus[restaurantId]) {
    return state.menus[restaurantId];
  }

  try {
    // Fetch from API if not in context
    const menuItems = await getRestaurantMenu(restaurantId);

    // Store in context
    dispatch({
      type: "SET_MENU",
      payload: {
        restaurantId: restaurantId.toString(),
        menu: menuItems,
      },
    });

    return menuItems;
  } catch (error) {
    console.error(`Error fetching menu for restaurant ${restaurantId}:`, error);
    return [];
  }
};

export const findMenuItemById = (
  id: number,
  menus: any,
  restaurantId: number
) => {
  const restaurantMenu = menus[restaurantId.toString()];
  return restaurantMenu?.find((item: any) => item.id === id);
};

export const getRestaurantNameById = (
  restaurants: any[],
  id: number
): string => {
  const restaurant = restaurants.find((item) => item.id === id);
  return restaurant ? restaurant.name : "Restaurant";
};

export const getRestaurantRatingById = (
  restaurants: any[],
  id: number
): string => {
  const restaurant = restaurants.find((item) => item.id === id);
  return restaurant ? restaurant.rating : "4.7";
};
