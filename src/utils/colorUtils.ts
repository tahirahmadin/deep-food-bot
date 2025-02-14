// Define base colors for each restaurant
const restaurantColors: Record<number, string> = {
  1: "#FFE5E5", // Art of Dum (Light Red)
  2: "#E5F0FF", // China Bistro (Light Blue)
  3: "#FFF7CC", // Dunkin Donut (Light Yellow)
  4: "#E8FFE8", // India Bistro (Light Green)
  5: "#FFD9EC", // Papa Jones (Light Pink)
  6: "#F5E5FF", // Art of Dum (Light Purple)
  7: "#D5E8FF", // China Bistro (Soft Blue)
  8: "#FFEED5", // Dunkin Donut (Peach Yellow)
  9: "#E0FFE5", // India Bistro (Mint Green)
  10: "#FFC2C7", // Papa Jones (Soft Coral Pink)
};

// Function to get background color for a restaurant
export const getRestaurantColors = (restaurantId: number | null): string => {
  if (!restaurantId) {
    return "#FFF5F2"; // Default background color
  }

  return restaurantColors[restaurantId] || "#FFF5F2";
};
