import React, { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { ChatMenuItem } from "./ChatMenuItem";
import { MenuItemWithImage } from "../data/menuDataFront";
import { useChatContext, QueryType } from "../context/ChatContext";
import { ChatService } from "../services/chatService";
import { getRestaurantNameById } from "../utils/menuUtils";

const chatService = new ChatService();

interface MenuListProps {
  messageId: number;
  items: any[];
  restroId: number;
}

export const MenuList: React.FC<MenuListProps> = ({ items, restroId }) => {
  const { state, dispatch } = useChatContext();

  // Get serialized memory for chat context
  const serializedMemory = React.useMemo(() => {
    return state.messages
      .map((message) =>
        message.isBot ? `Bot: ${message.text}` : `User: ${message.text}`
      )
      .join("\n");
  }, [state.messages]);

  const filteredMenuItems = useMemo(() => {
    // Create a map from the items array for quick lookup
    const itemMap = new Map(items.map((item) => [item.id, item.name]));

    // Filter menuItems and include the quantity from the items array
    return MenuItemWithImage.filter((menuItem) => itemMap.has(menuItem.id)).map(
      (menuItem) => ({
        ...menuItem,
        quantity: itemMap.get(menuItem.id), // Add quantity to the result
      })
    );
  }, [items, MenuItemWithImage]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {filteredMenuItems.map((meal, index) => (
          <ChatMenuItem
            key={index}
            id={meal.id}
            name={meal.name}
            price={meal.price}
            image={meal.image}
            quantity={meal.quantity}
            restroId={restroId}
          />
        ))}
      </div>
    </div>
  );
};
