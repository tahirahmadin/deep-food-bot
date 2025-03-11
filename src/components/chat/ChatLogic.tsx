import { useState } from "react";
import stringSimilarity from "string-similarity";
import { QueryType } from "../../context/ChatContext";
import { generateLLMResponse } from "../../actions/serverActions";
import { getMenuByRestaurantId, getRestaurantNameById, findMenuItemById } from "../../utils/menuUtils";
import { filterRestaurantsByDistance } from "../../utils/distanceUtils";

interface RecommendedItem {
  id?: number; 
  name: string;
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  time: string;
  queryType?: QueryType;
  recommendedItems?: RecommendedItem[]; 
}

interface ChatLogicProps {
  input: string;
  restaurantState: any;
  restaurantDispatch: any;
  state: any;
  dispatch: any;
  orders: any[];
  selectedStyle: any;
  isVegOnly: boolean;
  numberOfPeople: number;
  setRestaurants: (ids: number[]) => void;
  addresses: any[];
  chatHistory: Message[];
}

const MENU_CACHE_TTL = 2 * 60 * 1000;
const LLM_CACHE_TTL = 1 * 60 * 1000;
const RESTAURANT_QUERY_CACHE_TTL = 1 * 60 * 1000; 

interface CacheEntry<T> {
  value: T | null;
  timestamp: number;
  promise?: Promise<T>;
}

const menuCache = new Map<number, CacheEntry<any[]>>();
const llmCache = new Map<string, CacheEntry<any>>();
const restaurantQueryCache = new Map<string, CacheEntry<any>>();

const filterMenuItems = (menuItems: any[]): any[] =>
  menuItems.map(
    ({
      image,
      available,
      category,
      customisation,
      healthinessScore,
      isCustomisable,
      sweetnessLevel,
      spicinessLevel,
      dietaryPreference,
      caffeineLevel,
      sufficientFor,
      _id,
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
  const now = Date.now();

  if (llmCache.has(key)) {
    const entry = llmCache.get(key)!;
    if (now - entry.timestamp < LLM_CACHE_TTL) {
      if (entry.value) return entry.value;
      if (entry.promise) return await entry.promise;
    }
  }
  
  const promise = generateLLMResponse(prompt, maxTokens, model, temperature);
  llmCache.set(key, { value: null, timestamp: now, promise });
  const response = await promise;
  
  llmCache.set(key, { value: response, timestamp: Date.now() });
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


const buildConversationContext = (chatHistory: Message[], limit: number = 5): string => {
  const recentMessages = chatHistory.filter(msg => !msg.isBot).slice(-limit);
  return recentMessages.length > 0
    ? recentMessages
        .map((msg) => {
          let contextText = msg.text;
          if (msg.recommendedItems && msg.recommendedItems.length > 0) {
            contextText += " | Recommended: " + msg.recommendedItems.map(item => item.name).join(", ");
          }
          return contextText;
        })
        .join(" | ")
    : "";
};

const classifyIntent = async (
  query: string,
  activeRestroId: number | null,
  state: any,
  chatHistory: Message[],
  isImageBased: boolean = false
): Promise<QueryType> => {

  if (isImageBased) return QueryType.MENU_QUERY;

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

  const nutritionKeywords = ["calories", "nutrition", "fats", "protein", "carbs"];
  if (nutritionKeywords.some((keyword) => lowerQuery.includes(keyword))) {
    return QueryType.NUTRITION_QUERY;
  }

  const isRestaurant =
    restaurantKeywords.some((keyword) => lowerQuery.includes(keyword)) &&
    !activeRestroId;
  const isMenu = menuKeywords.some((keyword) => lowerQuery.includes(keyword));

  if (isRestaurant) return QueryType.RESTAURANT_QUERY;
  if (isMenu) return QueryType.MENU_QUERY;

  
  const conversationContext = buildConversationContext(chatHistory);

  const classificationPrompt = `
      You are an intent classifier for a food ordering platform that aggregates recommendations from multiple restaurants. Your task is to classify a given user query into exactly one of three types: "MENU_QUERY", "RESTAURANT_QUERY", or "GENERAL".
      
      Definitions:
      - "MENU_QUERY": Use this category when the query specifically requests a list of food items or dishes for ordering. Examples include: "What's on the menu?", "Show me available dishes", or "I want to order a burger". In this mode, the response will always recommend food items.
      - "RESTAURANT_QUERY": Use this category when the query is about the restaurant or the ordering service. This includes questions about location, delivery, ordering process, or direct restaurant recommendations. Even if food is mentioned, if the focus is on the restaurant's details, use this category.
      - "GENERAL": Use this category for queries that are conversational or ask for additional details about a food item (such as ingredients, taste, preparation). Also include greetings or casual conversation here. Responses for GENERAL queries are typically brief (2-3 lines) and chatty.
      - "NUTRITION_QUERY": Use this category when the query asks for nutritional information of a food item (for example, calories, fats, protein, or carbs) of a food item.
      
      Instructions:
      - Analyze the user query and any provided conversation context.
      - If the query asks for a list of dishes or ordering options, classify it as "MENU_QUERY".
      - If the query asks about the restaurant, its operations, or service details, classify it as "RESTAURANT_QUERY".
      - If the query asks for nutritional information of a food item (for example, calories, fats, protein, or carbs) of a food item, classify it as "NUTRITION_QUERY".
      - If the query asks for details about a food item (for example, "Tell me more about that dish", "What are its main ingredients?", or "Is it more creamy or tangy?") or is casual conversation, classify it as "GENERAL".
      - Base your decision solely on the query and any provided conversation context.
      
      User Query: "${query}"
      ${conversationContext ? `Conversation Context: "${conversationContext}"` : ""}
      
      Respond with only a JSON object with one key "text" whose value is exactly one of the three strings: "MENU_QUERY", "RESTAURANT_QUERY", or "GENERAL".
      
      STRICT FORMAT RULES:
      - Return only a valid JSON object in this exact format: { "text": "<intent>" }.
      - Do not include any extra text, explanations, markdown, or code fences.
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
      if (resultText.includes("RESTAURANT_QUERY"))
        return QueryType.RESTAURANT_QUERY;
      if (resultText.includes("NUTRITION_QUERY")) return QueryType.NUTRITION_QUERY;
      if (resultText.includes("GENERAL")) return QueryType.GENERAL;
    } catch (e) {
      const resultText = llmResult.text.trim().toUpperCase();
      if (resultText.includes("MENU_QUERY")) return QueryType.MENU_QUERY;
      if (resultText.includes("RESTAURANT_QUERY"))
        return QueryType.RESTAURANT_QUERY;
      if (resultText.includes("NUTRITION_QUERY")) return QueryType.NUTRITION_QUERY;
    }
  }
  return QueryType.GENERAL;
};

export const useChatLogic = ({
  input,
  restaurantState,
  restaurantDispatch,
  state,
  dispatch,
  orders,
  selectedStyle,
  isVegOnly,
  numberOfPeople,
  setRestaurants,
  addresses,
  chatHistory,
}: ChatLogicProps) => {
  const [currentRecommendation, setCurrentRecommendation] = useState<Array<{
    restaurantId: number;
    restaurantName: string;
    recommendedItems: RecommendedItem[];
  }> | null>(null);


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
    const now = Date.now();
    if (menuCache.has(restaurantId)) {
      const entry = menuCache.get(restaurantId)!;
      if (entry.value && now - entry.timestamp < MENU_CACHE_TTL) {
        return entry.value;
      }
      if (entry.promise) {
        return await entry.promise;
      }
    }
    const promise = (async () => {
      const menu = await getMenuByRestaurantId(restaurantId, restaurantState, restaurantDispatch);
      const filtered = filterMenuItems(menu);
      menuCache.set(restaurantId, { value: filtered, timestamp: Date.now() });
      return filtered;
    })();
    menuCache.set(restaurantId, { value: null, timestamp: now, promise });
    return await promise;
  };

  const handleRestaurantQuery = async (queryText?: string) => {
    const selectedAddress = addresses[0];
    let filteredRestaurants = restaurantState.restaurants;

    if (selectedAddress?.coordinates) {
      filteredRestaurants = filterRestaurantsByDistance(
        selectedAddress.coordinates.lat,
        selectedAddress.coordinates.lng,
        restaurantState.restaurants,
        5 // 10km radius
      );
    }

    const restaurantContext = filteredRestaurants.map((ele: any) => ({
      menuSummary: ele.menuSummary,
      name: ele.name,
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

    
    const conversationContext = buildConversationContext(
      chatHistory.filter((msg) => !msg.isBot)
    );

    const key =
      queryText !== undefined
        ? `image-${effectiveQuery}-${filteredRestaurants.map((r: any) => r.id).join(",")}`
        : `${input}-${filteredRestaurants.map((r: any) => r.id).join(",")}`;

    const now = Date.now();
    if (restaurantQueryCache.has(key)) {
      const entry = restaurantQueryCache.get(key)!;
      if (entry.value && now - entry.timestamp < RESTAURANT_QUERY_CACHE_TTL) {
        return entry.value;
      }
      if (entry.promise) {
        return await entry.promise;
      }
    }

    const promise = (async () => {
      const systemPrompt = ` 
      You are a restaurant recommendation system.
      Given the following restaurants: ${JSON.stringify(restaurantContext)},
      ${analysisText} and also consider previous order choices from ${orderContextItem}
      ${conversationContext ? `and also consider the previous conversation: "${conversationContext}"` : ""}
      and return exactly one JSON object:
        { "restroIds": [] }
      where:
        - "restroIds" is an array of up to 2 matching restaurant IDs (numeric).
      STRICT FORMAT RULES:
        - Return only a valid JSON object with no extra text, explanations, or markdown.
        - DO NOT include any special character before and after the json.
        - No code fences, no trailing commas, no disclaimers.
        - Only return a valid JSON object, nothing else.
      `;
      const response = await getCachedLLMResponse(
        systemPrompt,
        200,
        state.selectedModel,
        0.5
      );
      restaurantQueryCache.set(key, { value: response, timestamp: Date.now() });
      return response;
    })();
    restaurantQueryCache.set(key, { value: null, timestamp: now, promise });
    return await promise;
  };

  const handleMenuQuery = async (
    _queryType: QueryType, 
    userInput: string,
    isImageBased: boolean = false,
    imageCaption: string = "" 
  ) => {
    try {
      const now = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      const effectiveInput =
        isImageBased && imageCaption
          ? `Image shows: ${userInput}. User says: ${imageCaption}`
          : userInput;

      const queryType = isImageBased
        ? QueryType.MENU_QUERY
        : await classifyIntent(
            effectiveInput,
            restaurantState.activeRestroId,
            state,
            chatHistory,
            isImageBased
          );
      
      const conversationContext = buildConversationContext(
        chatHistory.filter((msg) => !msg.isBot)
      );

      const normalize = (str: string) => {
        return str.toLowerCase().replace(/[^\w\s]/g, "").trim();
      };

      if (queryType === QueryType.NUTRITION_QUERY) {
        let dishNameCandidate = "";
        if (effectiveInput.toLowerCase().includes(" in ")) {
          const parts = effectiveInput.split(/\s+in\s+/i);
          dishNameCandidate = parts[parts.length - 1].trim();
        } else {
          dishNameCandidate = effectiveInput.trim();
        }
      
        const normalizedCandidate = normalize(dishNameCandidate);
      
        let dishRestaurantName = "";
        let correctedDishName = "";
        let bestMatchScore = 0;
        const threshold = 0.7; 
      
        if (currentRecommendation && Array.isArray(currentRecommendation)) {
          for (const rec of currentRecommendation) {
            const menuItems = await getMenuItemsByFile(rec.restaurantId);
            for (const menuItem of menuItems) {
              if (!menuItem.name) continue;
              const normalizedMenuName = normalize(menuItem.name);
              const score = stringSimilarity.compareTwoStrings(normalizedCandidate, normalizedMenuName);
              if (score > threshold && score > bestMatchScore) {
                bestMatchScore = score;
                dishRestaurantName = getRestaurantNameById(restaurantState.restaurants, rec.restaurantId);
                correctedDishName = menuItem.name;
                console.log(`New best match: "${correctedDishName}" at ${dishRestaurantName} with score ${bestMatchScore}`);
              }
            }
          }
        }
      
        if (!dishRestaurantName) {
          correctedDishName = dishNameCandidate;
        }
      
        console.log("Final chosen dish restaurant:", dishRestaurantName);
        console.log("Final corrected dish name:", correctedDishName);
      
        const userDailyCalories = state.userPreferences?.dailyCalories || 2000;
        const calculateReferenceValues = (calories: number) => {
          const ratio = calories / 2000;
          return {
            calories: calories,
            protein: Math.round(50 * ratio),
            carbs: Math.round(300 * ratio),
            fat: Math.round(65 * ratio),
            saturatedFat: Math.round(20 * ratio),
            fiber: Math.round(25 * ratio),
            sugar: Math.round(25 * ratio),
            sodium: 2300
          };
        };
      
        const referenceValues = calculateReferenceValues(userDailyCalories);
      
        let nutritionContext = "";
        if (dishRestaurantName) {
          nutritionContext += `Restaurant Name: ${dishRestaurantName}. `;
        }
        if (correctedDishName) {
          nutritionContext += `Food Item: ${correctedDishName}. `;
        }
        nutritionContext += "Use Food Item name and Restaurant Name to determine nutritional details, if specific nutritional details are unavailable, provide close approximations.";
      
        console.log("Final nutritional context:", nutritionContext);
      
        const nutritionPrompt = `
              You are a nutrition assistant. Provide comprehensive nutritional information for the food item mentioned by the user.
              ${nutritionContext}
              ${conversationContext ? `and also consider the previous conversation: "${conversationContext}"` : ""}
        
              Important: The user follows a ${userDailyCalories} calorie diet. Please scale your nutritional assessment accordingly.
        
              Format the response as a JSON object exactly as follows:
              {
                "text": "Your Answer",
                "item": "Name of the food item",
                "calories": number,
                "totalFat": number,
                "saturatedFat": number,
                "protein": number,
                "carbs": number,
                "fiber": number,
                "sugar": number,
                "sodium": number,
                "isVegetarian": boolean,
                "isLowCalorie": boolean,
                "isHighProtein": boolean,
                "referenceValues": {
                  "calories": ${referenceValues.calories},
                  "protein": ${referenceValues.protein},
                  "carbs": ${referenceValues.carbs},
                  "fat": ${referenceValues.fat},
                  "saturatedFat": ${referenceValues.saturatedFat},
                  "fiber": ${referenceValues.fiber},
                  "sugar": ${referenceValues.sugar},
                  "sodium": ${referenceValues.sodium}
                }
              }
        
              where:
                - "text" provides a brief and creative response about the food item in ${selectedStyle.name} style.
                - "item" provides the name of the food item.
                - All nutrition values should be realistic for a standard serving size of the food.
                - "calories" should be in kcal.
                - "totalFat", "saturatedFat", "protein", "carbs", "fiber", and "sugar" should be in grams (g).
                - "sodium" should be in milligrams (mg).
                - "isVegetarian" should indicate if the food item is vegetarian.
                - "isLowCalorie" should be true for foods with fewer than ${Math.round(userDailyCalories * 0.125)} calories per serving (adjusted for user's diet).
                - "isHighProtein" should be true for foods with more than ${Math.round(referenceValues.protein * 0.3)} grams of protein per serving (adjusted for user's diet).
                - "referenceValues" provides the daily reference values based on the user's ${userDailyCalories} calorie diet.
        
              The user said: "${effectiveInput}"
        
              STRICT FORMAT RULES:
              - DO NOT include any markdown formatting.
              - DO NOT include explanations or additional text.
              - DO NOT include any special character, format before and after the json.
              - Only return a valid JSON object, nothing else.
              - Ensure all values are appropriate for the specific food item mentioned.
              - Base your nutritional values on standard serving sizes for the food item.
              `;
      
        const nutritionResponse = await getCachedLLMResponse(
          nutritionPrompt,
          300,
          state.selectedModel,
          0.5
        );
      
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            text: JSON.stringify(nutritionResponse),
            isBot: true,
            time: now,
            queryType,
          },
        });
        return;
      }

      if (queryType === QueryType.GENERAL) {
        if (isGreetingOnly(effectiveInput)) {
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
          The user said: "${effectiveInput}"
          ${conversationContext ? `Context: "${conversationContext}"` : ""}
          
          Return your answer in a JSON object with the following format:
          { "text": "your answer" }
          
          where:
          - "text" provides a brief and creative response to what the user said in ${selectedStyle.name} style.
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
          isImageBased ? effectiveInput : undefined
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
        ? imageCaption 
          ? `analyze the image description: "${userInput}" along with user's comment: "${imageCaption}"`
          : `analyze the image description: "${userInput}"`
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
        ${conversationContext ? `Also, consider the following conversation context: "${conversationContext}"` : ""}
        and return a JSON response: ${
          activeRestroId
            ? `{ "text": "", "items1": [] }`
            : `{ "text": "", "items1": [], "items2": [] }`
        }
        where:
          - "text" provides a concise and creative response and reasoning showing you understand the query in ${selectedStyle.name} style.
          - ${
            activeRestroId
              ? `"items1" is array contains id of up to 5 recommended items.`
              : `"items1" and "items2" contains id of up to 5 relevant items each.`
          }
          ${isVegOnly ? " Provide only VEGETARIAN options." : ""}
        STRICT FORMAT RULES:
          - DO NOT include any markdown formatting.
          - DO NOT include explanations or additional text.
          - DO NOT include any special character before and after the json.
          - Only return a valid JSON object, nothing else.
      `;
      const menuResponse = await getCachedLLMResponse(
        menuPrompt,
        400,
        state.selectedModel,
        0.5
      );
  
      if ((suggestRestroIds.length > 0 || activeRestroId) && menuResponse) {
        if (!restaurantState.activeRestroId) {
          const recs = [];
          recs.push({
            restaurantId: suggestRestroIds[0],
            restaurantName: getRestaurantNameById(restaurantState.restaurants, suggestRestroIds[0]),
            recommendedItems: menuResponse.items1.map((item: any) => ({
              id: item.id,
            })),
          });
          if (suggestRestroIds.length > 1 && menuResponse.items2) {
            recs.push({
              restaurantId: suggestRestroIds[1],
              restaurantName: getRestaurantNameById(restaurantState.restaurants, suggestRestroIds[1]),
              recommendedItems: menuResponse.items2.map((item: any) => ({
                id: item.id,
              })),
            });
          }
          setCurrentRecommendation(recs);
        } else {
          setCurrentRecommendation([{
            restaurantId: restaurantState.activeRestroId,
            restaurantName: getRestaurantNameById(restaurantState.restaurants, restaurantState.activeRestroId),
            recommendedItems: menuResponse.items1.map((item: any) => ({
              id: item.id,
              name: "",
            })),
          }]);
        }
        
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now() + 1,
            
            recommendedItems: menuResponse.items1 || [],
            text: menuResponse.text,
            llm: {
              output: menuResponse,
              restroIds: restaurantState.activeRestroId ? [restaurantState.activeRestroId] : suggestRestroIds,
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
    currentRecommendation, 
  };
};
