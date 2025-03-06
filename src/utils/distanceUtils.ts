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

  return distance > 10 ? 9.9 : distance / 1.05; // Returns distance in kilometers
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
  maxDistance: number = 5 // Default max distance is 10km
): any[] => {
  return restaurants.filter((restaurant) => {
    if (!restaurant.location || restaurant.location?.coordinates.length !== 2) {
      return false;
    }

    const [restLng, restLat] = restaurant.location.coordinates;
    const distance = calculateDistance(userLat, userLng, restLat, restLng);

    return distance <= maxDistance;
  });
};

// Function to get current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

// Function to get address from coordinates using Google Geocoding API
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number,
  apiKey: string
): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    throw new Error("No address found");
  } catch (error) {
    console.error("Error getting address:", error);
    throw error;
  }
};

// Function to handle location errors
export const handleLocationError = (error: any): string => {
  console.error("Location error:", error);

  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location permission denied. Please enable location access.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "Location request timed out.";
      default:
        return "An unknown error occurred getting your location.";
    }
  }

  return "Failed to get your location. Please try again.";
};
