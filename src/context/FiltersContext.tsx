import React, { createContext, useContext, useState } from "react";
import { Theme, getThemeForStyle } from "../utils/themeUtils";

export interface Style {
  name: string;
  image: string;
}

interface FiltersContextType {
  isVegOnly: boolean;
  setIsVegOnly: (value: boolean) => void;
  isFastDelivery: boolean;
  setIsFastDelivery: (value: boolean) => void;
  numberOfPeople: number;
  setNumberOfPeople: (value: number) => void;
  selectedStyle: Style;
  setSelectedStyle: (style: Style) => void;
  theme: Theme;
}

const defaultStyle = {
  name: "Gobbl",
  image:
    "https://gobbl-bucket.s3.ap-south-1.amazonaws.com/tapAssets/gobbl_coin.webp",
};

const FiltersContext = createContext<FiltersContextType | null>(null);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isFastDelivery, setIsFastDelivery] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<Style>(defaultStyle);
  const theme = getThemeForStyle(selectedStyle.name);

  return (
    <FiltersContext.Provider
      value={{
        isVegOnly,
        setIsVegOnly,
        isFastDelivery,
        setIsFastDelivery,
        numberOfPeople,
        setNumberOfPeople,
        selectedStyle,
        setSelectedStyle,
        theme,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
};

export const useFiltersContext = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFiltersContext must be used within a FiltersProvider");
  }
  return context;
};
