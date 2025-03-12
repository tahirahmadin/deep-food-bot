import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  getAllRestaurants,
  getSingleRestaurant,
} from "../actions/serverActions";
import { SingleRestro } from "../types/menu";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";
import { useChatContext } from "./ChatContext";

interface RestaurantState {
  selectedRestroIds: number[];
  activeRestroId: number | null;
  singleMode: boolean;
  cashMode: boolean;
  backgroundImage: string | null;
  restaurants: SingleRestro[];
  menus: {
    [key: string]: any[];
  };
}

type RestaurantAction =
  | { type: "SET_RESTRO_IDS"; payload: number[] }
  | { type: "SET_ACTIVE_RESTRO"; payload: number | null }
  | { type: "SET_BACKGROUND_IMAGE"; payload: string | null }
  | { type: "CLEAR_RESTRO_IDS" }
  | { type: "SET_RESTAURANTS"; payload: SingleRestro[] }
  | { type: "SET_MENU"; payload: { restaurantId: string; menu: any[] } }
  | { type: "RESET_STATE" };

const initialState: RestaurantState = {
  selectedRestroIds: [],
  singleMode: false,
  cashMode: false,
  backgroundImage: null,
  activeRestroId: null,
  restaurants: [],
  menus: {},
};

const restaurantReducer = (
  state: RestaurantState,
  action: RestaurantAction
): RestaurantState => {
  switch (action.type) {
    case "SET_RESTRO_IDS":
      return {
        ...state,
        selectedRestroIds: action.payload,
        activeRestroId: null, // Reset active ID when setting multiple IDs
      };
    case "SET_ACTIVE_RESTRO":
      return {
        ...state,
        activeRestroId: action.payload,
      };
    case "SET_BACKGROUND_IMAGE":
      return {
        ...state,
        backgroundImage: action.payload,
      };
    case "SET_RESTAURANTS":
      return {
        ...state,
        restaurants: action.payload,
      };
    case "SET_MENU":
      return {
        ...state,
        menus: {
          ...state.menus,
          [action.payload.restaurantId]: action.payload.menu,
        },
      };
    case "CLEAR_RESTRO_IDS":
      return {
        ...state,
        selectedRestroIds: [],
        activeRestroId: null,
      };
    case "RESET_STATE":
      return {
        ...state,
        selectedRestroIds: [],
        activeRestroId: null,
      };
    default:
      return state;
  }
};

const RestaurantContext = createContext<{
  state: RestaurantState;
  dispatch: React.Dispatch<RestaurantAction>;
} | null>(null);

const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addresses, isAuthenticated } = useAuth();

  const [state, dispatch] = useReducer(restaurantReducer, initialState);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const restaurantId = searchParams.get("restaurantId");

  useEffect(() => {
    const fetchRestaurants = async () => {
      console.log("restaurantId Context");
      console.log(restaurantId);
      // Get coordinates from the selected (first) address
      const selectedAddress = addresses[0];
      const coordinates = selectedAddress?.coordinates;

      if (restaurantId) {
        // Adjust the second parameter (limit) as needed.
        const restaurantData = await getSingleRestaurant(restaurantId);
        console.log(restaurantData);
        if (restaurantData) {
          dispatch({ type: "SET_RESTAURANTS", payload: [restaurantData] });
        }

        const backImageUrl =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4jOHl2IQswMq9Na2ZmVTxv8GoWXb31iLZyQ&s";
        dispatch({
          type: "SET_BACKGROUND_IMAGE",
          payload: backImageUrl,
        });

        dispatch({
          type: "SET_ACTIVE_RESTRO",
          payload: restaurantId,
        });

        // chatDispatch({
        //   type: "SET_SELECTED_RESTAURANT",
        //   payload: restaurantData?.restaurant,
        // });
      } else {
        if (coordinates) {
          // Fetch restaurants based on coordinates.
          // Adjust the second parameter (limit) as needed.
          const restaurantData = await getAllRestaurants(coordinates, 3);
          dispatch({ type: "SET_RESTAURANTS", payload: restaurantData });
        }
      }
    };

    // If the user is authenticated and a valid address with coordinates exists, fetch restaurants.
    if (isAuthenticated && addresses.length > 0 && addresses[0]?.coordinates) {
      fetchRestaurants();
    }
  }, [isAuthenticated, addresses, dispatch, restaurantId]);

  return (
    <RestaurantContext.Provider value={{ state, dispatch }}>
      {children}
    </RestaurantContext.Provider>
  );
};

function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }

  const { state, dispatch } = context;
  const { addresses } = useAuth();

  const setRestaurants = (ids: number[]) => {
    if (JSON.stringify(state.selectedRestroIds) !== JSON.stringify(ids)) {
      dispatch({ type: "SET_RESTRO_IDS", payload: ids });
    }
  };

  const setActiveRestaurant = (id: number | null) => {
    if (state.activeRestroId !== id) {
      dispatch({ type: "SET_ACTIVE_RESTRO", payload: id });
    }
  };

  const clearRestaurants = () => {
    dispatch({ type: "CLEAR_RESTRO_IDS" });
  };

  const setRestaurantList = (restaurants: SingleRestro[]) => {
    dispatch({ type: "SET_RESTAURANTS", payload: restaurants });
  };

  const refreshRestaurants = async () => {
    try {
      const selectedAddress = addresses[0];
      const coordinates = selectedAddress?.coordinates;
      if (coordinates) {
        const restaurantData = await getAllRestaurants(coordinates);
        dispatch({ type: "SET_RESTAURANTS", payload: restaurantData });
      }
    } catch (error) {
      console.error("Error refreshing restaurants:", error);
    }
  };

  const value = {
    state,
    dispatch,
    setRestaurants,
    setActiveRestaurant,
    clearRestaurants,
    setRestaurantList,
    refreshRestaurants,
  };

  return value;
}

export { RestaurantProvider, useRestaurant };
