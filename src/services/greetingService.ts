import axios from "axios";

interface WeatherData {
  main: {
    temp: number;
  };
  weather: [
    {
      main: string;
      description: string;
    }
  ];
}

interface Location {
  city: string;
  country: string;
}

export class GreetingService {
  private readonly openaiKey: string;
  private readonly weatherKey: string;

  constructor() {
    this.openaiKey = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY;
    this.weatherKey = import.meta.env.VITE_WEATHER_API_KEY || "demo";
  }

  private async getCurrentLocation(): Promise<Location> {
    try {
      const response = await axios.get("https://ipapi.co/json/");
      return {
        city: response.data.city,
        country: response.data.country_name,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return { city: "Dubai", country: "UAE" }; // Default fallback
    }
  }

  private async getWeather(city: string): Promise<WeatherData | null> {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${this.weatherKey}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting weather:", error);
      return null;
    }
  }

  private async getSpecialOccasions(country: string): Promise<string[]> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    try {
      const response = await axios.get(
        `https://date.nager.at/api/v3/PublicHolidays/${today.getFullYear()}/${country}`
      );

      return response.data
        .filter((holiday: any) => {
          const holidayDate = new Date(holiday.date);
          return (
            holidayDate.getMonth() + 1 === month &&
            holidayDate.getDate() === day
          );
        })
        .map((holiday: any) => holiday.name);
    } catch (error) {
      console.error("Error getting holidays:", error);
      return [];
    }
  }

  private async generateGreeting(
    location: Location,
    weather: WeatherData | null,
    occasions: string[]
  ): Promise<string> {
    const prompt = `
      Create a friendly, personalized greeting for a food delivery app user with these details:
      - Location: ${location.city}, ${location.country}
      - Weather: ${
        weather
          ? `${weather.main.temp}°C, ${weather.weather[0].description}`
          : "Unknown"
      }
      - Special occasions: ${
        occasions.length > 0 ? occasions.join(", ") : "None"
      }

      The greeting should:
      1. Be warm and inviting
      2. Reference the weather or occasion if relevant
      3. Encourage food ordering
      4. Be 15-25 words maximum
      5. End with a question about what they'd like to eat
      6. Be conversational and casual

      Return ONLY the greeting text, no additional formatting or explanation.
    `;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating greeting:", error);
      return "Hi! Cozy weather today calls for something delicious. Let me know what you're craving?";
    }
  }

  public async getGreeting(): Promise<string> {
    try {
      // const location = await this.getCurrentLocation();
      // const weather = await this.getWeather(location.city);
      // const occasions = await this.getSpecialOccasions(location.country);

      // return await this.generateGreeting(location, weather, occasions);
      return "Hi! Cozy weather today calls for something delicious. Let me know what you're craving?";
    } catch (error) {
      console.error("Error in greeting service:", error);
      return "Hi! Cozy weather today calls for something delicious. Let me know what you're craving?";
    }
  }
}
