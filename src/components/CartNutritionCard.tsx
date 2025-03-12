import React, { useState, useEffect } from 'react';
import { useFiltersContext } from '../context/FiltersContext';
import { 
  Cookie, 
  Flame, 
  Beef, 
  Apple, 
  Droplet, 
  CircleDot,
  Heart,
  Asterisk,
  Info,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

const CartNutritionCard = ({ 
  nutritionData, 
  onClose,
  itemImage = null,
  showHeader = true  
}) => {
  const { theme } = useFiltersContext();
  const [showDetails, setShowDetails] = useState(false);
  const [animated, setAnimated] = useState(false);
  
  const data = typeof nutritionData === 'string' 
    ? JSON.parse(nutritionData) 
    : nutritionData;
    
  const DEFAULT_REFERENCE_VALUES = {
    calories: 2000,
    protein: 50,
    carbs: 300,
    fat: 65,
    saturatedFat: 20,
    fiber: 25,
    sugar: 25,
    sodium: 2300
  };
  
  const referenceValues = data.referenceValues || DEFAULT_REFERENCE_VALUES;

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const primaryNutrition = [
    { 
      name: 'Calories', 
      value: data.calories, 
      unit: 'kcal', 
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      icon: <Flame className="w-4 h-4" />,
      percentage: Math.min(data.calories / referenceValues.calories * 100, 100),
      reference: referenceValues.calories
    },
    { 
      name: 'Protein', 
      value: data.protein, 
      unit: 'g', 
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      icon: <Beef className="w-4 h-4" />,
      percentage: Math.min(data.protein / referenceValues.protein * 100, 100),
      reference: referenceValues.protein
    },
    { 
      name: 'Carbs', 
      value: data.carbs, 
      unit: 'g', 
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      icon: <Apple className="w-4 h-4" />,
      percentage: Math.min(data.carbs / referenceValues.carbs * 100, 100),
      reference: referenceValues.carbs
    },
    { 
      name: 'Total Fat', 
      value: data.totalFat || data.fats, 
      unit: 'g', 
      color: 'bg-red-500',
      textColor: 'text-red-500',
      bgColor: 'bg-red-50',
      icon: <Droplet className="w-4 h-4" />,
      percentage: Math.min((data.totalFat || data.fats) / referenceValues.fat * 100, 100),
      reference: referenceValues.fat
    }
  ];

  const secondaryNutrition = [
    { 
      name: 'Saturated Fat', 
      value: data.saturatedFat || Math.round((data.totalFat || data.fats) * 0.3), 
      unit: 'g',
      icon: <Droplet className="w-3 h-3" />,
      color: 'bg-red-300',
      reference: referenceValues.saturatedFat,
      percentage: Math.min((data.saturatedFat || 0) / referenceValues.saturatedFat * 100, 100)
    },
    { 
      name: 'Fiber', 
      value: data.fiber || Math.round(data.carbs * 0.1),
      unit: 'g',
      icon: <CircleDot className="w-3 h-3" />,
      color: 'bg-green-300',
      reference: referenceValues.fiber,
      percentage: Math.min((data.fiber || 0) / referenceValues.fiber * 100, 100)
    },
    { 
      name: 'Sugar', 
      value: data.sugar || Math.round(data.carbs * 0.2), 
      unit: 'g',
      icon: <Cookie className="w-3 h-3" />,
      color: 'bg-purple-300',
      reference: referenceValues.sugar,
      percentage: Math.min((data.sugar || 0) / referenceValues.sugar * 100, 100)
    },
    { 
      name: 'Sodium', 
      value: data.sodium || (data.calories * 1.5), // Fallback estimation
      unit: 'mg',
      icon: <Asterisk className="w-3 h-3" />,
      color: 'bg-blue-300',
      reference: referenceValues.sodium,
      percentage: Math.min((data.sodium || 0) / referenceValues.sodium * 100, 100)
    }
  ];

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with close button - conditionally rendered */}
      {showHeader && (
        <div 
          className="px-4 py-3 flex justify-between items-center"
          style={{ 
            backgroundColor: theme.modalBgLight,
            color: theme.modalMainText,
            borderBottom: `1px solid ${theme.cardHighlight}30`
          }}
        >
          <h3 className="font-semibold text-sm">Nutrition Information</h3>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200/50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Content area with scrolling */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Item info with image */}
        <div className="flex items-center gap-3 mb-4">
          {itemImage && (
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img src={itemImage} alt={data.item} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: theme.primary }}>
                <Cookie className="w-3 h-3" />
                <span>{data.item}</span>
              </div>
              {data.isVegetarian && (
                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  <Heart className="w-3 h-3" />
                  <span>Veg</span>
                </div>
              )}
            </div>
            <p className="text-xs" style={{ color: theme.modalMainText }}>{data.text}</p>
          </div>
        </div>
        
        {/* Daily Reference Value Info */}
        <div className="mb-3">
          <div className="text-xs opacity-70" style={{ color: theme.modalSecondText }}>
            Based on a {referenceValues.calories} calorie diet
          </div>
        </div>
        
        {/* Primary nutrition values with circular indicators */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {primaryNutrition.map((item, index) => (
            <div 
              key={item.name} 
              className="p-2 rounded-lg flex items-center shadow-sm"
              style={{ backgroundColor: `${theme.cardHighlight}15` }}
            >
              {/* Circular progress */}
              <div className="relative w-10 h-10 mr-2 flex-shrink-0">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle 
                    cx="20" cy="20" r="16" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    strokeWidth="3"
                  />
                  <circle 
                    cx="20" cy="20" r="16" 
                    fill="none" 
                    stroke={theme.primary} 
                    strokeWidth="3"
                    strokeDasharray="100.53"
                    strokeDashoffset={animated ? 100.53 - (item.percentage * 1.0053) : 100.53}
                    transform="rotate(-90 20 20)"
                    style={{ transition: `stroke-dashoffset 1s ease-out ${index * 0.2}s` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {item.icon}
                </div>
              </div>
              
              {/* Value */}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: theme.modalMainText }}>
                    {item.name}
                  </span>
                  <span className="text-[10px] opacity-70" style={{ color: theme.modalSecondText }}>
                    {Math.round(item.percentage)}%
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-base font-bold" style={{ color: theme.primary }}>
                    {item.value}
                  </span>
                  <span className="ml-1 text-[10px] opacity-70" style={{ color: theme.modalSecondText }}>
                    {item.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Toggle for detailed info */}
        <button 
          onClick={toggleDetails}
          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg mb-3 transition-colors"
          style={{ 
            backgroundColor: `${theme.cardHighlight}15`,
            color: theme.primary
          }}
        >
          <span className="text-xs font-medium">
            {showDetails ? "Hide Details" : "Show More Details"}
          </span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {/* Collapsible detailed nutrition */}
        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 animate-fadeIn" style={{ backgroundColor: `${theme.cardHighlight}10` }}>
            <div className="flex items-center mb-2">
              <Info className="w-3 h-3 mr-1" style={{ color: theme.primary }} />
              <span className="text-xs font-medium" style={{ color: theme.modalMainText }}>
                Detailed Nutrition
              </span>
            </div>
            
            <div className="space-y-2">
              {secondaryNutrition.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div style={{ color: theme.primary }} className="mr-1">
                        {item.icon}
                      </div>
                      <span className="text-xs" style={{ color: theme.modalMainText }}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs font-medium" style={{ color: theme.modalMainText }}>
                        {item.value} {item.unit}
                      </span>
                      <span className="text-[10px] ml-1 opacity-70" style={{ color: theme.modalSecondText }}>
                        ({Math.round(item.percentage)}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Nutritional composition bar */}
        <div className="mb-1">
          <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100 mb-1">
            <div className="flex h-full">
              <div className="h-full bg-orange-500" style={{ width: `${Math.min(primaryNutrition[0].percentage, 25)}%` }}></div>
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(primaryNutrition[1].percentage, 25)}%` }}></div>
              <div className="h-full bg-yellow-500" style={{ width: `${Math.min(primaryNutrition[2].percentage, 25)}%` }}></div>
              <div className="h-full bg-red-500" style={{ width: `${Math.min(primaryNutrition[3].percentage, 25)}%` }}></div>
            </div>
          </div>
          
          <div className="flex text-[10px] justify-between opacity-60" style={{ color: theme.modalSecondText }}>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
              <span>Calories</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
              <span>Protein</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
              <span>Carbs</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
              <span>Fat</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default CartNutritionCard;