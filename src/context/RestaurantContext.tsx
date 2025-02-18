import React, { createContext, useContext, useReducer } from "react";
import { getAllRestaurants } from "../actions/serverActions";
import { SingleRestro } from "../types/menu";

interface RestaurantState {
  selectedRestroIds: number[];
  activeRestroId: number | null;
  restaurants: SingleRestro[];
  menus: {
    [key: string]: any[];
  };
}

type RestaurantAction =
  | { type: "SET_RESTRO_IDS"; payload: number[] }
  | { type: "SET_ACTIVE_RESTRO"; payload: number | null }
  | { type: "CLEAR_RESTRO_IDS" }
  | { type: "SET_RESTAURANTS"; payload: SingleRestro[] }
  | { type: "SET_MENU"; payload: { restaurantId: string; menu: any[] } }
  | { type: "RESET_STATE" };

const initialState: RestaurantState = {
  selectedRestroIds: [],
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
  const [state, dispatch] = useReducer(restaurantReducer, initialState);
  const hasInitialFetch = React.useRef(false);

  React.useEffect(() => {
    if (hasInitialFetch.current) return;

    const fetchRestaurants = async () => {
      const restaurantData = await getAllRestaurants();
      dispatch({ type: "SET_RESTAURANTS", payload: restaurantData });
      hasInitialFetch.current = true;
    };

    fetchRestaurants();
  }, []);

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

  // Add convenience functions
  const { state, dispatch } = context;

  const setRestaurants = (ids: number[]) => {
    // Only dispatch if the IDs are different from current state
    if (JSON.stringify(state.selectedRestroIds) !== JSON.stringify(ids)) {
      dispatch({ type: "SET_RESTRO_IDS", payload: ids });
    }
  };

  const setActiveRestaurant = (id: number | null) => {
    // Only dispatch if the ID is different from current active ID
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

  const value = {
    state,
    dispatch,
    setRestaurants,
    setActiveRestaurant,
    clearRestaurants,
    setRestaurantList,
  };

  return value;
}

export { RestaurantProvider, useRestaurant };
