import React, { useMemo } from "react";
import { ChatMenuItem } from "./ChatMenuItem";
import { useChatContext } from "../context/ChatContext";
import { useRestaurant } from "../context/RestaurantContext";
import { getMenuByRestaurantId } from "../utils/menuUtils";

interface MenuListProps {
  messageId: number;
  items: number[]; // Now items is an array of numeric IDs
  restroId: number;
}

export const MenuList: React.FC<MenuListProps> = ({ items, restroId }) => {
  const { state } = useChatContext();
  const { state: restaurantState, dispatch: restaurantDispatch } = useRestaurant();
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
    const idSet = new Set<number>(items);
    return menuItems.filter((menuItem) => idSet.has(menuItem.id));
  }, [items, menuItems]);

  return (
    <div className="flex flex-col gap-1">
      {/* Scrollable container with dynamic width */}
      <div className="overflow-x-auto w-[250px]">
        {/* Flex container that takes exact width of menu items */}
        <div className="flex items-center gap-1 w-max">
          {filteredMenuItems.map((meal) => (
            <ChatMenuItem
              key={meal.id}
              id={meal.id}
              name={meal.name}
              price={meal.price}
              image={
                meal.image && meal.image != ""
                  ? meal.image
                  : "https://i.pinimg.com/originals/da/4f/c2/da4fc2360e1dcc5c85cf5eeaee4b107f.gif"
              }
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
