import React, { createContext, useContext, useReducer } from "react";

interface RestaurantState {
  selectedRestroIds: number[];
  activeRestroId: number | null;
}

type RestaurantAction =
  | { type: "SET_RESTRO_IDS"; payload: number[] }
  | { type: "SET_ACTIVE_RESTRO"; payload: number }
  | { type: "CLEAR_RESTRO_IDS" };

const initialState: RestaurantState = {
  selectedRestroIds: [],
  activeRestroId: null,
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
    case "CLEAR_RESTRO_IDS":
      return {
        ...state,
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

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(restaurantReducer, initialState);

  return (
    <RestaurantContext.Provider value={{ state, dispatch }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
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

  const setActiveRestaurant = (id: number) => {
    // Only dispatch if the ID is different from current active ID
    if (state.activeRestroId !== id) {
      dispatch({ type: "SET_ACTIVE_RESTRO", payload: id });
    }
  };

  const clearRestaurants = () => {
    dispatch({ type: "CLEAR_RESTRO_IDS" });
  };

  const value = {
    state,
    dispatch,
    setRestaurants,
    setActiveRestaurant,
    clearRestaurants,
  };

  return value;
};
