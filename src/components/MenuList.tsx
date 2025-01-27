import React, { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { MenuItem } from "./MenuItem";
import { MenuItemWithImage } from "../data/menuDataFront";
import { useChatContext, QueryType } from "../context/ChatContext";
import { ChatService } from "../services/chatService";

const chatService = new ChatService();

interface MenuListProps {
  messageId: number;
  items: any[];
}

export const MenuList: React.FC<MenuListProps> = ({ items }) => {
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
    console.log(items);
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
    <div className="mt-2 ">
      <div className="grid grid-cols-2 sm:flex overflow-x-auto px-2 sm:px-4 gap-2 sm:gap-3 snap-x scrollbar-hide pb-2">
        {filteredMenuItems.map((meal, index) => (
          <div key={index} className="sm:flex-none sm:w-[120px] snap-start">
            <MenuItem
              id={meal.id}
              name={meal.name}
              price={meal.price}
              image={meal.image}
              quantity={meal.quantity}
              compact={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
