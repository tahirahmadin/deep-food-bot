import React, { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { ChatMenuItem } from "./ChatMenuItem";
import { useChatContext, QueryType } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { ChatService } from "../services/chatService";
import { getMenuByRestaurantId } from "../utils/menuUtils";

interface MenuListProps {
  messageId: number;
  items: any[];
  restroId: number;
}

export const MenuList: React.FC<MenuListProps> = ({ items, restroId }) => {
  const { state, dispatch } = useChatContext();
  const { state: restaurantState, dispatch: restaurantDispatch } =
    useRestaurant();
  const [menuItems, setMenuItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurantState.menus[restroId]) {
        const items = await getMenuByRestaurantId(
          restroId,
          restaurantState,
          restaurantDispatch
        );
        setMenuItems(items);
      } else {
        setMenuItems(restaurantState.menus[restroId]);
      }
    };
    fetchMenuItems();
  }, [restroId, restaurantState, restaurantDispatch]);

  const filteredMenuItems = useMemo(() => {
    // Create a map from the items array for quick lookup
    const itemMap = new Map(items.map((item) => [item.id, item.name]));
    // Filter fetched menuItems and include the quantity from the items array
    return menuItems
      .filter((menuItem) => itemMap.has(menuItem.id))
      .map((menuItem) => ({
        ...menuItem,
        quantity: itemMap.get(menuItem.id), // Add quantity to the result
      }));
  }, [items, menuItems]);

  return (
    <div className="flex flex-col gap-1">
      {/* Scrollable container with dynamic width */}
      <div className="overflow-x-auto w-[250px]">
        {/* Flex container that takes exact width of menu items */}
        <div className="flex items-center gap-1 w-max">
          {filteredMenuItems.map((meal, index) => (
            <ChatMenuItem
              key={index}
              id={meal.id}
              name={meal.name}
              price={meal.price}
              image={`https://gobbl-restaurant-bucket.s3.ap-south-1.amazonaws.com/${restroId}/${restroId}-${meal.id}.jpg`}
              restroId={restroId}
              isCustomisable={meal.isCustomisable}
              customisation={meal.customisation}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
