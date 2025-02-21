import React from "react";
import { ImageService } from "../../services/imageService";
import { QueryType } from "../../context/ChatContext";

interface ImageHandlerProps {
  state: any;
  dispatch: any;
  restaurantState: any;
  selectedStyle: any;
  isVegOnly: boolean;
  numberOfPeople: number;
  orders: any[];
  setRestaurants: (ids: number[]) => void;
  getMenuItemsByFile: (restaurantId: number) => Promise<any[]>;
  handleMenuQuery: (
    queryType: QueryType,
    userInput: string,
    isImageBased?: boolean
  ) => Promise<any>;
}

export const useImageHandler = ({
  state,
  dispatch,
  restaurantState,
  selectedStyle,
  isVegOnly,
  numberOfPeople,
  orders,
  setRestaurants,
  getMenuItemsByFile,
  handleMenuQuery,
}: ImageHandlerProps) => {
  const imageService = new ImageService();

  const handleImageUpload = async (
    file: File,
    setIsImageAnalyzing: (value: boolean) => void
  ) => {
    setIsImageAnalyzing(true);
    const imageUrl = URL.createObjectURL(file);

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: Date.now(),
        text: "Image uploaded",
        isBot: false,
        time: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
        imageUrl,
        queryType: QueryType.MENU_QUERY,
      },
    });

    try {
      const imageDescription = await imageService.analyzeImage(file);
      
      await handleMenuQuery(
        QueryType.MENU_QUERY,
        imageDescription,
        true
      );
      
    } catch (error) {
      console.error("Error processing image:", error);
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now() + 999,
          text: "Sorry, I couldn't analyze the image or fetch items.",
          isBot: true,
          time: new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          queryType: QueryType.GENERAL,
        },
      });
    } finally {
      setIsImageAnalyzing(false);
    }
  };

  return { handleImageUpload };
};
