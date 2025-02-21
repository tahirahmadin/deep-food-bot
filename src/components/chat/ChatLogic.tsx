import { QueryType } from "../../context/ChatContext";
import { generateLLMResponse } from "../../actions/serverActions";
import { getMenuByRestaurantId } from "../../utils/menuUtils";
import { filterRestaurantsByDistance } from "../../utils/distanceUtils";

interface ChatLogicProps {
  input: string;
  restaurantState: any;
  state: any;
  dispatch: any;
  orders: any[];
  selectedStyle: any;
  isVegOnly: boolean;
  numberOfPeople: number;
  setRestaurants: (ids: number[]) => void;
  addresses: any[];
}

export const useChatLogic = ({
  input,
  restaurantState,
  state,
  dispatch,
  orders,
  selectedStyle,
  isVegOnly,
  numberOfPeople,
  setRestaurants,
  addresses,
}: ChatLogicProps) => {
  const determineQueryType = (
    query: string,
    activeRestroId: number | null
  ): QueryType => {
    const restaurantKeywords = [
      "restaurant",
      "place",
      "where",
      "location",
      "open",
      "closed",
      "timing",
      "hours",
      "address",
    ];

    const menuKeywords = [
      "price",
      "cost",
      "how much",
      "menu",
      "order",
      "buy",
      "get",
      "recommend",
      "suggest",
      "what should",
      "what's good",
    ];

    query = query.toLowerCase();

    if (
      restaurantKeywords.some((keyword) => query.includes(keyword)) &&
      !activeRestroId
    ) {
      return QueryType.RESTAURANT_QUERY;
    }

    if (menuKeywords.some((keyword) => query.includes(keyword))) {
      return QueryType.MENU_QUERY;
    }

    return QueryType.GENERAL;
  };

  const getMenuItemsByFile = async (restaurantId: number): Promise<any[]> => {
    return await getMenuByRestaurantId(restaurantId, restaurantState, dispatch);
  };

  const handleRestaurantQuery = async () => {
    // Filter restaurants by distance if user has address with coordinates
    const selectedAddress = addresses[0];
    let filteredRestaurants = restaurantState.restaurants;

    // if (selectedAddress?.coordinates) {
    //   console.log("selectedAddress");
    //   console.log(selectedAddress);
    //   filteredRestaurants = filterRestaurantsByDistance(
    //     selectedAddress.coordinates.lat,
    //     selectedAddress.coordinates.lng,
    //     restaurantState.restaurants,
    //     10 // 10km radius
    //   );
    // }
    console.log("filteredRestaurants");
    console.log(filteredRestaurants);
    let restaurantContext = filteredRestaurants.map((ele: any) => ({
      menuSummary: ele.menuSummary,
      name: ele.name,
      description: ele.description,
      id: ele.id,
      coordinates: ele.coordinates,
    }));

    const orderContextItem = [
      ...new Set(
        orders?.flatMap((ele) => ele.items?.map((itemObj) => itemObj.name)) ||
          []
      ),
    ].join(", ");

    const systemPrompt = `
      You are a restaurant recommendation system.
      Given the following restaurants: ${JSON.stringify(restaurantContext)},
      analyze the user's query: "${input}" and also consider his previous order choices from ${orderContextItem}
      and return exactly one JSON object:
        {
          "text": "",
          "restroIds": []
        }
      where:
        - "text" is a short, relevant response.
        - "restroIds" is an array of up to 2 matching restaurant IDs (numeric).

      STRICT FORMAT RULES:
        - Return only a valid JSON object with no extra text, explanations, or markdown.
        - No code fences, no trailing commas, no disclaimers.
        - Only return a valid JSON object, nothing else.
    `;

    const response = await generateLLMResponse(
      systemPrompt,
      200,
      state.selectedModel,
      0.5
    );

    return response;
  };

  const handleMenuQuery = async (queryType: QueryType, userInput: string) => {
    try {
      let apiResponseText = null;
      let restaurant1Menu = [];
      let restaurant2Menu = [];
      let activeMenu = [];
      let suggestRestroText = "";
      let suggestRestroIds = [];

      const { activeRestroId, restaurants } = restaurantState;

      if (!activeRestroId) {
        // Get restaurant recommendations
        const response = await handleRestaurantQuery();
        suggestRestroText = response.text;
        suggestRestroIds = response.restroIds;

        if (queryType === QueryType.RESTAURANT_QUERY) {
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: suggestRestroText,
              llm: {
                output: {
                  text: suggestRestroText,
                  items1: [],
                  items2: [],
                  restroIds: suggestRestroIds,
                },
                restroIds: suggestRestroIds,
              },
              isBot: true,
              time: new Date().toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              }),
              queryType,
            },
          });
          return;
        }

        if (suggestRestroIds.length > 0) {
          setRestaurants(suggestRestroIds);
          restaurant1Menu = await getMenuItemsByFile(suggestRestroIds[0]);
          if (suggestRestroIds.length > 1) {
            restaurant2Menu = await getMenuItemsByFile(suggestRestroIds[1]);
          }
        }
      } else {
        activeMenu = await getMenuItemsByFile(activeRestroId);
      }

      const menuPrompt = `
        You are a menu recommendation system.
        Given the menu items from ${
          activeRestroId ? "a restaurant" : "two restaurants"
        }:
        ${
          activeRestroId
            ? JSON.stringify(activeMenu)
            : JSON.stringify(restaurant1Menu) +
              " and " +
              JSON.stringify(restaurant2Menu)
        },
        analyze the user's query: "${userInput}"
        and return a JSON response: 
        ${
          activeRestroId
            ? `{ "text": "", "items1": [{ "id": number, "name": string }] }`
            : `{ "text": "", "items1": [{ "id": number, "name": string }], "items2": [{ "id": number, "name": string }] }`
        } 
        where:
          - "text" provides a concise and creative response in ${
            selectedStyle.name
          } style.
          - ${
            activeRestroId
              ? `"items1" contains up to 3 recommended items.`
              : `"items1" and "items2" contain up to 3 relevant items each from their respective restaurant menus.`
          }
          ${isVegOnly ? " Provide only VEGETARIAN options." : ""}
          ${
            numberOfPeople > 1
              ? ` Show portions sufficient for ${numberOfPeople} people.`
              : ""
          }
        STRICT FORMAT RULES:
          - DO NOT include any markdown formatting.
          - DO NOT include explanations or additional text.
          - Only return a valid JSON object, nothing else.
      `;

      const menuResponse = await generateLLMResponse(
        menuPrompt,
        1000,
        state.selectedModel,
        0.5
      );

      if ((suggestRestroIds.length > 0 || activeRestroId) && menuResponse) {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: menuResponse.text,
            llm: {
              output: menuResponse,
              restroIds: activeRestroId ? [activeRestroId] : suggestRestroIds,
            },
            isBot: true,
            time: new Date().toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }),
            queryType,
          },
        });
      } else {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: suggestRestroText,
            isBot: true,
            time: new Date().toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }),
            queryType: QueryType.GENERAL,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    getMenuItemsByFile,
    handleRestaurantQuery,
    handleMenuQuery,
    determineQueryType,
  };
};
