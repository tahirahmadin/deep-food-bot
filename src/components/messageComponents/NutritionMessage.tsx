import React from "react";
import { Message as MessageType } from "../types";
import NutritionCard from "./NutritionCard";
import { useFiltersContext } from "../../context/FiltersContext";

interface NutritionMessageProps {
  message: MessageType;
}

export const NutritionMessage: React.FC<NutritionMessageProps> = ({ message }) => {
  const { selectedStyle } = useFiltersContext();
  
  // Parse the nutrition data from the message
  let nutritionData = null;
  try {
    nutritionData = JSON.parse(message.text);
  } catch (e) {
    console.error("Failed to parse nutrition data:", e);
    return <div className="p-2 text-sm">Could not display nutrition information.</div>;
  }

  return (
    <div className="p-2">
      <NutritionCard 
        nutritionData={nutritionData} 
        selectedStyle={selectedStyle} 
      />
    </div>
  );
};