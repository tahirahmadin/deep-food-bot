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

const menuCache = new Map<number, any[]>();
const llmCache = new Map<string, any>();
const restaurantQueryCache = new Map<string, any>();

const filterMenuItems = (menuItems: any[]): any[] =>
  menuItems.map(
    ({
      image,
      price,
      available,
      customisation,
      healthinessScore,
      isCustomisable,
      sweetnessLevel,
      caffeineLevel,
      description,
      ...rest
    }) => rest
  );

const getLLMCacheKey = (
  prompt: string,
  maxTokens: number,
  model: string,
  temperature: number
) => `${prompt}-${maxTokens}-${model}-${temperature}`;

const getCachedLLMResponse = async (
  prompt: string,
  maxTokens: number,
  model: string,
  temperature: number
) => {
  const key = getLLMCacheKey(prompt, maxTokens, model, temperature);
  if (llmCache.has(key)) return llmCache.get(key);
  const response = await generateLLMResponse(
    prompt,
    maxTokens,
    model,
    temperature
  );
  llmCache.set(key, response);
  return response;
};

const isGreetingOnly = (query: string): boolean => {
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "whatsup",
    "whats up"
  ];
  const cleaned = query.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return greetings.includes(cleaned);
};

const classifyIntent = async (
  query: string,
  activeRestroId: number | null,
  state: any
): Promise<QueryType> => {
  const restaurantKeywords = [
    "restaurant",
    "place",
    "where",
    "location",
    "open",
    "closed",
    "timing",
    "hours",
    "address"
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
    "something to eat"
  ];

  const lowerQuery = query.toLowerCase();

  const isRestaurant = restaurantKeywords.some((keyword) => lowerQuery.includes(keyword)) && !activeRestroId;
  const isMenu = menuKeywords.some((keyword) => lowerQuery.includes(keyword));

  if (isRestaurant) return QueryType.RESTAURANT_QUERY;
  if (isMenu) return QueryType.MENU_QUERY;

  const classificationPrompt = `
  You are an intent classifier for a food ordering system.
  
  Classify the following user query into one of three types:
  - "MENU_QUERY": Any query specifically about ordering food items or dishes (e.g., "Do you have pasta?", "What's on the menu?", "I want to order a burger","I feel like eating something spicy")
  - "RESTAURANT_QUERY": Any query about the restaurant itself (e.g., "What are your hours?", "Where are you located?", "Do you deliver?")
  - "GENERAL": Any query that doesn't directly relate to ordering food or restaurant information, including:
     * Greetings (e.g., "Hello", "Hi there")
     * Nutritional inquiries (e.g., "How many calories in a burrito?", "What are the ingredients in your pizza?")
     * General conversation (e.g., "Thank you", "How are you?")
  
  Query: "${query}"
  
  Respond with only the intent type as text.
  Return your answer in a JSON object with the following format:
  { "text": "<your answer>" }
  
  STRICT FORMAT RULES:
  - Return only a valid JSON object with no extra text, explanations, markdown or code fences.
`;
  const llmResult = await getCachedLLMResponse(
    classificationPrompt,
    50,
    state.selectedModel,
    0.3
  );

  if (llmResult && llmResult.text) {
    try {
      const parsed = JSON.parse(llmResult.text);
      const resultText = parsed.text.toUpperCase();
      if (resultText.includes("MENU_QUERY")) return QueryType.MENU_QUERY;
      if (resultText.includes("RESTAURANT_QUERY")) return QueryType.RESTAURANT_QUERY;
      if (resultText.includes("GENERAL")) return QueryType.GENERAL;
    } catch (e) {
      const resultText = llmResult.text.trim().toUpperCase();
      if (resultText.includes("MENU_QUERY")) return QueryType.MENU_QUERY;
      if (resultText.includes("RESTAURANT_QUERY")) return QueryType.RESTAURANT_QUERY;
    }
  }
  return QueryType.GENERAL;
};

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
    )
      return QueryType.RESTAURANT_QUERY;
    if (menuKeywords.some((keyword) => query.includes(keyword)))
      return QueryType.MENU_QUERY;
    return QueryType.GENERAL;
  };

  const getMenuItemsByFile = async (restaurantId: number): Promise<any[]> => {
    if (menuCache.has(restaurantId)) return menuCache.get(restaurantId)!;
    const menu = await getMenuByRestaurantId(
      restaurantId,
      restaurantState,
      dispatch
    );
    const filtered = filterMenuItems(menu);
    menuCache.set(restaurantId, filtered);
    return filtered;
  };

  const handleRestaurantQuery = async (queryText?: string) => {
    const selectedAddress = addresses[0];
    let filteredRestaurants = restaurantState.restaurants;
    const restaurantContext = filteredRestaurants.map((ele: any) => ({
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

    const effectiveQuery = queryText !== undefined ? queryText : input;
    const analysisText =
      queryText !== undefined
        ? `analyze the image description: "${effectiveQuery}"`
        : `analyze the user's query: "${effectiveQuery}"`;

    const key =
      queryText !== undefined
        ? `image-${effectiveQuery}-${filteredRestaurants
            .map((r: any) => r.id)
            .join(",")}`
        : `${input}-${filteredRestaurants.map((r: any) => r.id).join(",")}`;

    if (restaurantQueryCache.has(key)) return restaurantQueryCache.get(key);

    const systemPrompt = `
      You are a restaurant recommendation system.
      Given the following restaurants: ${JSON.stringify(restaurantContext)},
      ${analysisText} and also consider previous order choices from ${orderContextItem}
      and return exactly one JSON object:
        { "text": "", "restroIds": [] }
      where:
        - "text" is a short, relevant response.
        - "restroIds" is an array of up to 2 matching restaurant IDs (numeric).
      STRICT FORMAT RULES:
        - Return only a valid JSON object with no extra text, explanations, or markdown.
        - No code fences, no trailing commas, no disclaimers.
        - Only return a valid JSON object, nothing else.
    `;
    const response = await getCachedLLMResponse(
      systemPrompt,
      200,
      state.selectedModel,
      0.5
    );
    restaurantQueryCache.set(key, response);
    return response;
  };

  const handleMenuQuery = async (
    _queryType: QueryType, 
    userInput: string,
    isImageBased: boolean = false
  ) => {
    try {
      const now = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      const queryType = await classifyIntent(userInput, restaurantState.activeRestroId, state);

      if (queryType === QueryType.GENERAL) {
        if (isGreetingOnly(userInput)) {
          const friendlyResponseText = "Hello! How can I help you today?";
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: JSON.stringify({ text: friendlyResponseText }),
              isBot: true,
              time: now,
              queryType,
            },
          });
          return;
        } else {
          const genericPrompt = `
          You are Gobbl, a food recommendation bot. Your task is to handle general queries that don't directly relate to ordering food or restaurant information.
          
          These general queries include:
          * Greetings (e.g., "Hello", "Hi there")
          * Nutritional inquiries (e.g., "How many calories in a burrito?", "What are the ingredients in your pizza?") - provide general information about food nutrition
          * General conversation (e.g., "Thank you", "How are you?")
          The user said: "${userInput}"
          
          Return your answer in a JSON object with the following format:
          { "text": "your answer" }
          
          where:
          - "text" provides a brief and creative response to what user said in ${selectedStyle.name} style.
          - For food preferences, suggest restaurants or dishes that match their preferences
          - For nutritional inquiries, provide helpful general information
          - For greetings, welcome them to the food recommendation service
          
          STRICT FORMAT RULES:
          - DO NOT identify yourself as a cooking assistant or recipe guide
          - DO NOT include any markdown formatting
          - DO NOT include explanations or additional text
          - Only return a valid JSON object, nothing else
        `;
          const genericResponse = await getCachedLLMResponse(
            genericPrompt,
            200,
            state.selectedModel,
            0.5
          );
          dispatch({
            type: "ADD_MESSAGE",
            payload: {
              id: Date.now() + 1,
              text: genericResponse.text,
              isBot: true,
              time: now,
              queryType,
            },
          });
          return;
        }
      }

      let restaurant1Menu: any[] = [],
        restaurant2Menu: any[] = [],
        activeMenu: any[] = [];
      let suggestRestroText = "";
      let suggestRestroIds: number[] = [];
      const { activeRestroId } = restaurantState;

      if (!activeRestroId) {
        const response = await handleRestaurantQuery(
          isImageBased ? userInput : undefined
        );
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
              time: now,
              queryType,
            },
          });
          return;
        }
        if (suggestRestroIds.length > 0) {
          setRestaurants(suggestRestroIds);
          const menus = await Promise.all([
            getMenuItemsByFile(suggestRestroIds[0]),
            suggestRestroIds.length > 1
              ? getMenuItemsByFile(suggestRestroIds[1])
              : Promise.resolve([]),
          ]);
          restaurant1Menu = menus[0];
          restaurant2Menu = menus[1];
        }
      } else {
        activeMenu = await getMenuItemsByFile(activeRestroId);
      }

      const analysisPart = isImageBased
        ? `analyze the image description: "${userInput}"`
        : `analyze the user's query: "${userInput}"`;

      const menuPrompt = `
        You are a menu recommendation system.
        Given the menu items from ${
          activeRestroId ? "a restaurant" : "two restaurants"
        }: ${
        activeRestroId
          ? JSON.stringify(activeMenu)
          : JSON.stringify(restaurant1Menu) +
            " and " +
            JSON.stringify(restaurant2Menu)
      },
        ${analysisPart}
        and return a JSON response: ${
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
              : `"items1" and "items2" contain up to 3 relevant items each.`
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
      const menuResponse = await getCachedLLMResponse(
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
            time: now,
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
            time: now,
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
    classifyIntent,   
  };
};
