// Define base colors for each restaurant
const restaurantColors: Record<number, string> = {
  1: "#FFF5F2", // Art of Dum
  2: "#F0F7FF", // China Bistro
  3: "#FFF4E6", // Dunkin Donut
  4: "#F3F9FF", // India Bistro
  5: "#FFF1F2", // Papa Jones
};

// Function to get background color for a restaurant
export const getRestaurantColors = (restaurantId: number | null): string => {
  if (!restaurantId) {
    return "#FFF5F2"; // Default background color
  }

  return restaurantColors[restaurantId] || "#FFF5F2";
};
