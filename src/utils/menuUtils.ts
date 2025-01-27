import { MenuItemWithImage } from "../data/menuDataFront";

export const findMenuItemById = (id: number) => {
  return MenuItemWithImage.find((item) => item.id === id);
};
