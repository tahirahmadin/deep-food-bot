// src/services/chatService.ts
import { QueryType } from "../context/ChatContext";

interface ChatResponse {
  response: string;
}

interface MenuResult {
  text?: string;
  content?: string;
  score?: number;
  relevance?: string;
  metadata?: Record<string, any>;
}

interface MilvusResponse {
  response?: {
    results?: MenuResult[];
    query_context?: {
      original_query?: string;
      processed_query?: string;
      timestamp?: string;
    };
  };
  results?: MenuResult[];
  data?: {
    results?: MenuResult[];
  };
}

export class ChatService {
  private readonly restaurantId: string;
  private readonly queryUrl: string;
  private readonly openaiKey: string;

  constructor() {
    const restaurantId = "1000";
    const queryUrl = import.meta.env.VITE_PUBLIC_QUERY_DOCUMENT_API_URL;
    const openaiKey = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY;

    if (!restaurantId || !queryUrl || !openaiKey) {
      throw new Error("Missing required environment variables");
    }

    this.restaurantId = restaurantId;
    this.queryUrl = queryUrl;
    this.openaiKey = openaiKey;
  }

  private determineQueryType(
    query: string,
    activeRestroId: number | null
  ): QueryType {
    console.log("\n=== Query Type Determination ===");
    console.log("Original Query:", query);

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
      "branch",
      "outlet",
      "distance",
      "near",
      "closest",
      "rating",
      "review",
      "cuisine",
      "type of food",
      "ambiance",
      "atmosphere",
      "seating",
      "reservation",
      "book",
      "parking",
      "delivery",
      "takeout",
      "dine in",
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
      "suggestion",
      "spicy",
      "veg",
      "non veg",
      "party",
      "best",
      "popular",
      "favorite",
      "special",
      "show",
      "give",
      "sweet",
      "what is",
    ];

    query = query.toLowerCase();
    console.log("Lowercase Query:", query);

    const matchedRestaurantKeywords = restaurantKeywords.filter((keyword) =>
      query.includes(keyword)
    );

    const matchedMenuKeywords = menuKeywords.filter((keyword) =>
      query.includes(keyword)
    );

    if (matchedRestaurantKeywords.length > 0 && activeRestroId === null) {
      console.log("➡️ Determined Type: RESTAURANT_QUERY");
      return QueryType.RESTAURANT_QUERY;
    }

    if (matchedMenuKeywords.length > 0) {
      console.log("➡️ Determined Type: MENU_QUERY");
      return QueryType.MENU_QUERY;
    }

    console.log("➡️ Determined Type: GENERAL");
    return QueryType.GENERAL;
  }

  public async queryMenu(
    query: string,
    serializedMemory: string = ""
  ): Promise<ChatResponse> {
    try {
      // Input validation
      if (!query?.trim()) {
        throw new Error("Query cannot be empty");
      }

      // Early configuration validation
      if (!this.queryUrl || !this.restaurantId) {
        throw new Error(
          "Missing required configuration: queryUrl or restaurantId"
        );
      }

      const queryType = this.determineQueryType(query);

      // Handle menu-specific queries
      if (queryType === QueryType.MENU_QUERY) {
        return await this.handleMenuQuery(query, serializedMemory);
      }

      // Handle general queries
      return {
        response: await this.getOpenAIResponse(query, "", serializedMemory),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Split out menu query handling for better organization
  private async handleMenuQuery(
    query: string,
    serializedMemory: string
  ): Promise<ChatResponse> {
    try {
      const milvusResponse = await this.fetchMenuData(query);
      const menuContext = this.extractMenuContext(milvusResponse);

      if (!menuContext?.trim()) {
        return {
          response: JSON.stringify({
            start: "I couldn't find any relevant menu items.",
            menu: [],
            end: "Could you try rephrasing your question?",
          }),
        };
      }

      return {
        response: await this.getOpenAIResponse(
          query,
          menuContext,
          serializedMemory
        ),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Separate API call logic
  private async fetchMenuData(query: string): Promise<MilvusResponse> {
    const response = await fetch(this.queryUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Consider adding authentication headers if needed
      },
      body: JSON.stringify({
        restaurantId: this.restaurantId,
        query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Menu service error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data) {
      throw new Error("Empty response from menu service");
    }
    console.log(data);
    return data;
  }

  // Centralized error handling
  private handleError(error: unknown): ChatResponse {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Query error:", error);

    return {
      response: JSON.stringify({
        start: "I apologize for the inconvenience.",
        menu: [],
        end: `There was an error processing your request: ${errorMessage}`,
      }),
    };
  }

  private async getOpenAIResponse(
    query: string,
    menuContext: string,
    serializedMemory: string
  ): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.createSystemPrompt(
              menuContext,
              query,
              serializedMemory
            ),
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.4,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("content");
    console.log(content);
    // For menu queries, validate the response is proper JSON
    if (menuContext) {
      try {
        // Try parsing as JSON to validate format
        JSON.parse(content);
        return content;
      } catch (error) {
        // If not valid JSON, wrap the response in proper JSON format
        // return JSON.stringify({
        //   start: "Here's what I found:",
        //   menu: [],
        //   end: content,
        // });
        JSON.parse(content);
        return content;
      }
    }

    return content;
  }

  private createSystemPrompt(
    menuContext: string,
    query: string,
    serializedMemory: string
  ): string {
    const memoryContext = serializedMemory
      ? `Previous conversation:\n${serializedMemory}\n\n`
      : "";

    return `You are a specialized Dunkin' Donuts chatbot assistant that provides menu information and recommendations. Your responses must strictly follow the defined JSON structure.

RESPONSE FORMAT:
{
  "start": string, // Friendly opening message or context
  "menu": [        // Array of menu items, can be empty
    {
      "id": string,    // Unique identifier from menuContext
      "name": string,  // Item name exactly as in menuContext
      "price": string, // Numeric price without currency symbol
      "quantity": string // Quantity for the order/suggestion
    },
    {
      "id": string,    // Unique identifier from menuContext
      "name": string,  // Item name exactly as in menuContext
      "price": string, // Numeric price without currency symbol
      "quantity": string // Quantity for the order/suggestion
    },
    {
      "id": string,    // Unique identifier from menuContext
      "name": string,  // Item name exactly as in menuContext
      "price": string, // Numeric price without currency symbol
      "quantity": string // Quantity for the order/suggestion
    }
  ],
  "end": string    // Closing message or follow-up question
}

RESPONSE RULES:
1. Always return valid JSON STRICTLY in RESPONSE FORMAT
2. Never include additional fields
3. Maintain consistent data types
4. Use exact values from ${menuContext}
5. Empty menu array is valid when appropriate
6. Keep messages conversational but concise
7. Include quantities only when relevant
8. Validate all IDs against ${menuContext}
9. Do not to repeat the items from ${menuContext} untill it is required
10. Suggest more than 2 items untill the items are less available from the menu
11. Always return correct id from the ${menuContext} by matching


INTERACTION PATTERNS:

1. General Queries (e.g., "How many items do you have?")
   - Use empty menu array
   - Provide count/info in start field
   - Include follow-up question in end field

2. Menu Item Requests (e.g., "Show me breakfast items")
   - List relevant items in menu array
   - Explain selection criteria in start field
   - Suggest related items in end field

3. Recommendations (e.g., "What's popular?")
   - Include top items in menu array
   - Explain recommendation basis in start field
   - Suggest complementary items in end field

4. Item Specific Queries (e.g., "Tell me about the glazed donut")
   - Include specific item in menu array
   - Provide item details in start field
   - Suggest related items in end field

Available Context:
- menuContext: ${menuContext} // Menu database
- query: ${query} // Current user input
- memory context: ${memoryContext}  // previous conversation history

Example Responses:

1. Count Query:
{
  "start": "We currently have 50 delicious items on our menu",
  "menu": [],
  "end": "Would you like to see our most popular items?"
}

2. Recommendation Query:
{
  "start": "Here are our top-rated breakfast items",
  "menu": [
    {"id": "1", "name": "Classic Bagel", "price": "3.99", "quantity": "1"},
    {"id": "88", "name": "Glazed Donut", "price": "1.99", "quantity": "1"},
    {"id": "157", "name": "Frappe", "price": "1.99", "quantity": "1"}
    {"id": "218", "name": "Water", "price": "1.99", "quantity": "1"},
  ],
  "end": "Would you like to add a hot coffee to complete your breakfast?"
}

Do not return output response like this:
    Frappe is a popular choice for a refreshing cold beverage. Here are some frappe options we offer:
{
  "start": "Frappe is a delightful cold beverage choice. Here are some options:",
  "menu": [
    {
      "id": "37",
      "name": "Matcha Frappe",
      "price": "23.00"
    },
    {
      "id": "28",
      "name": "Cookies Cream Frappe - Made with Oreo",
      "price": "23.00"
    },
    {
      "id": "29",
      "name": "Double Chocolate Frappe",
      "price": "22.00"
    }
  ],
  "end": "Would you like to pair your frappe with a delicious donut?"
}
  You can see there is line starting with "Frappe is a popular choice...", even this line required, insert this in start parameter of the object

-  If query is this: Suggest me with other options from the menu - Then always return with different items from the menu, do not repeat old response.

This prompt structure ensures:
- Consistent JSON formatting
- Accurate menu information
- Natural conversation flow
- Easy response parsing
- Reliable data validation

 Memory Processing:
    Parse ${memoryContext} to:
    Extract previous orders/preferences
    Track dietary restrictions
    Identify favorite items
    Note disliked items
    Remember customizations
    Consider order frequency


Recommendation Logic:
    Match preferences from memory
    Factor in dietary restrictions
    Highlight:
    Spiciness/sweetness levels
    Health scores
    Popular items
    Portion sizes
    Caffeine preferences
    `;
  }

  private extractMenuContext(milvusData: MilvusResponse): string {
    console.log("Extracting menu context from backend response");

    const resultsExtractionStrategies = [
      () => milvusData.response?.results,
      () => milvusData.results,
      () => milvusData.data?.results,
    ];

    let extractedResults: MenuResult[] | undefined;
    for (const strategy of resultsExtractionStrategies) {
      extractedResults = strategy();
      if (extractedResults?.length > 0) break;
    }

    if (!extractedResults?.length) {
      console.log("No results found in backend response");
      return "";
    }

    const menuContext = extractedResults
      .map((result) => {
        const text = (result.text || result.content || "").trim();
        const priceMatches = text.match(/AED\s*\d+(\.\d{2})?/g) || [];
        const prices = priceMatches.map((p) => p.trim());
        const description = text
          .replace(/AED\s*\d+(\.\d{2})?/g, "")
          .replace(/\s+/g, " ")
          .trim();
        return prices.length > 0 ? `${prices[0]} ${description}` : description;
      })
      .filter((item) => item.length > 0)
      .filter((item, index, self) => self.indexOf(item) === index)
      .join("\n");

    console.log("Extracted menu context length:", menuContext.length);
    return menuContext;
  }
}
