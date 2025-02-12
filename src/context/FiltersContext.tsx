import React, { createContext, useContext, useState } from "react";

interface Style {
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
}

const defaultStyle = {
  name: "Trump",
  image:
    "https://images.unsplash.com/photo-1580128660010-fd027e1e587a?q=80&w=1964&auto=format&fit=crop",
};

const FiltersContext = createContext<FiltersContextType | null>(null);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [isFastDelivery, setIsFastDelivery] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<Style>(defaultStyle);

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
