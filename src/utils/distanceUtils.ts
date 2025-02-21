// Function to calculate distance between two points using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Returns distance in kilometers
};

// Helper function to convert degrees to radians
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Function to filter restaurants by distance
export const filterRestaurantsByDistance = (
  userLat: number,
  userLng: number,
  restaurants: any[],
  maxDistance: number = 10 // Default max distance is 10km
): any[] => {
  console.log("userLat");
  console.log(userLat);
  console.log(userLng);
  console.log(restaurants);
  return restaurants.filter((restaurant) => {
    if (!restaurant.location || restaurant.location?.coordinates.length !== 2) {
      return false;
    }

    const [restLng, restLat] = restaurant.location.coordinates;
    const distance = calculateDistance(userLat, userLng, restLat, restLng);

    return distance <= maxDistance;
  });
};
