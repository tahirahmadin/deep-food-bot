import React, { useMemo, useState } from "react";
import axios from "axios";
import { MenuItemWithImage } from "../data/menuDataFront";
import { menuItems } from "../data/menuData";
import { MenuItem } from "./MenuItem";
import { ImageIcon } from "lucide-react";

interface ApiResponse {
  text: string;
  items: { id: number; name: string; price: string }[];
}

const MenuChatWithDeepSeek: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
  const API_KEY = import.meta.env.VITE_PUBLIC_DEEPSEEK_KEY;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsLoading(true);

    try {
      const prompt = `Here is the menu data: ${JSON.stringify(
        menuItems
      )}. Based on the uploaded image, suggest suitable menu items. Return response as { "text": "brief description", "items": [{"id": number, "name": string, "price": string}] }. Include 2-4 items.`;

      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const apiResponseText = response.data.choices[0].message.content;
      setResponse(JSON.parse(apiResponseText));
    } catch (error) {
      console.error("Error:", error);
      setResponse({
        text: "Sorry, I couldn't process that image. Please try again.",
        items: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const prompt = `Here is the menu data: ${JSON.stringify(
        menuItems
      )}. Based on this, answer the user's query: ${inputText}. Return the response in the format { text: "", items: [{ id: number, name: string, price: string }] }. Include max 7 items.`;

      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const apiResponseText = response.data.choices[0].message.content;
      setResponse(JSON.parse(apiResponseText));
    } catch (error) {
      console.error("Error:", error);
      setResponse({
        text: "Failed to fetch response. Please try again.",
        items: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMenuItems = useMemo(() => {
    if (!response?.items) return [];
    const itemMap = new Map(response.items.map((item) => [item.id, item.name]));
    return MenuItemWithImage.filter((menuItem) => itemMap.has(menuItem.id)).map(
      (menuItem) => ({
        ...menuItem,
        quantity: itemMap.get(menuItem.id),
      })
    );
  }, [response]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu Chat with DeepSeek</h1>

      <div className="mb-4 space-y-4">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="h-32 object-cover rounded-lg"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about the menu..."
              rows={4}
              className="flex-1 p-2 rounded-lg border"
            />
            <label className="cursor-pointer p-2 bg-blue-500 h-fit rounded-full text-white">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <ImageIcon className="w-5 h-5" />
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Send"}
          </button>
        </form>

        {response && (
          <div className="mt-4">
            <p className="text-gray-700 mb-4">{response.text}</p>
            <div className="grid grid-cols-2 gap-4">
              {filteredMenuItems.map((meal, index) => (
                <MenuItem
                  key={index}
                  id={meal.id}
                  name={meal.name}
                  price={meal.price}
                  image={meal.image}
                  quantity={2}
                  compact={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuChatWithDeepSeek;
