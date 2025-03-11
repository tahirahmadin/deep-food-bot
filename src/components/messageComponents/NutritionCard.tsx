import React, { useState, useEffect } from 'react';
import { useFiltersContext } from '../../context/FiltersContext';
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
  ChevronUp
} from 'lucide-react';

// Default reference values in case they're not provided in the response
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

const NutritionCard = ({ nutritionData, selectedStyle }) => {
  const { theme } = useFiltersContext();
  const [showDetails, setShowDetails] = useState(false);
  const [animated, setAnimated] = useState(false);
  
  // Parse the nutrition data if it's a string
  const data = typeof nutritionData === 'string' 
    ? JSON.parse(nutritionData) 
    : nutritionData;
    
  // Use reference values from the response if available, otherwise use defaults
  const referenceValues = data.referenceValues || DEFAULT_REFERENCE_VALUES;

  // Trigger animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Primary nutrition info for the main grid
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
      value: data.totalFat || data.fats, // Fallback for compatibility
      unit: 'g', 
      color: 'bg-red-500',
      textColor: 'text-red-500',
      bgColor: 'bg-red-50',
      icon: <Droplet className="w-4 h-4" />,
      percentage: Math.min((data.totalFat || data.fats) / referenceValues.fat * 100, 100),
      reference: referenceValues.fat
    }
  ];

  // Secondary nutrition info for the detailed breakdown
  const secondaryNutrition = [
    { 
      name: 'Saturated Fat', 
      value: data.saturatedFat || Math.round((data.totalFat || data.fats) * 0.3), // Fallback estimation 
      unit: 'g',
      icon: <Droplet className="w-3 h-3" />,
      color: 'bg-red-300',
      reference: referenceValues.saturatedFat,
      percentage: Math.min(data.saturatedFat / referenceValues.saturatedFat * 100, 100)
    },
    { 
      name: 'Fiber', 
      value: data.fiber || Math.round(data.carbs * 0.1), // Fallback estimation
      unit: 'g',
      icon: <CircleDot className="w-3 h-3" />,
      color: 'bg-green-300',
      reference: referenceValues.fiber,
      percentage: Math.min(data.fiber / referenceValues.fiber * 100, 100)
    },
    { 
      name: 'Sugar', 
      value: data.sugar || Math.round(data.carbs * 0.2), // Fallback estimation
      unit: 'g',
      icon: <Cookie className="w-3 h-3" />,
      color: 'bg-purple-300',
      reference: referenceValues.sugar,
      percentage: Math.min(data.sugar / referenceValues.sugar * 100, 100)
    },
    { 
      name: 'Sodium', 
      value: data.sodium || (data.calories * 1.5), // Fallback estimation
      unit: 'mg',
      icon: <Asterisk className="w-3 h-3" />,
      color: 'bg-blue-300',
      reference: referenceValues.sodium,
      percentage: Math.min(data.sodium / referenceValues.sodium * 100, 100)
    }
  ];

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="w-full">
      {/* Header with image similar to MenuMessage */}
      <div className="pr-3 flex-shrink-0 flex mb-3">
        {selectedStyle && (
          <img
            src={selectedStyle.image}
            alt={selectedStyle.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-secondary mr-2"
          />
        )}
        <div className="text-[13px] flex-1" style={{ color: theme.text }}>
          Here's the nutrition breakdown for <span className="font-semibold">{data.item}</span>
        </div>
      </div>
      
      {/* Daily Reference Value Info */}
      {/* <div className="mb-3 pl-3">
        <div className="text-xs opacity-70" style={{ color: theme.text }}>
          Daily values based on a {referenceValues.calories} calorie diet
        </div>
      </div> */}
      
      {/* Food item name and description */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
            <Cookie className="w-3 h-3" />
            <span>{data.item}</span>
          </div>
        </div>
        <p className="text-sm mt-2 pl-3" style={{ color: theme.text }}>
          {data.text}
        </p>
      </div>
      
      {/* Animated circular progress indicators */}
      <div className="pl-3 mb-3">
        <div className="grid grid-cols-2 gap-3">
          {primaryNutrition.map((item, index) => (
            <div 
              key={item.name} 
              className="p-2 rounded-lg flex flex-col shadow-sm"
              style={{ backgroundColor: `${theme.cardHighlight}20` }}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1">
                  {item.icon}
                  <span className="font-medium text-xs" style={{ color: theme.text }}>{item.name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
              </div>
              
              {/* Circular progress with animation */}
              <div className="flex items-center">
                <div className="relative w-12 h-12 mr-2">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    {/* Background circle */}
                    <circle 
                      cx="24" cy="24" r="20" 
                      fill="none" 
                      stroke="#e5e7eb" 
                      strokeWidth="4"
                    />
                    
                    {/* Animated progress circle */}
                    <circle 
                      cx="24" cy="24" r="20" 
                      fill="none" 
                      stroke={theme.primary} 
                      strokeWidth="4"
                      strokeDasharray="126"
                      strokeDashoffset={animated ? 126 - (item.percentage * 1.26) : 126}
                      transform="rotate(-90 24 24)"
                      className="progress-circle"
                      style={{ 
                        transition: `stroke-dashoffset 1s ease-out ${index * 0.2}s`,
                      }}
                    />
                  </svg>
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: theme.primary }}
                  >
                    <span className="text-xs font-bold">
                      {Math.round(item.percentage)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold" style={{ color: theme.primary }}>
                      {item.value}
                    </span>
                    <span className="ml-1 text-xs opacity-70" style={{ color: theme.text }}>
                      {item.unit}
                    </span>
                  </div>
                  <div className="text-xs opacity-60" style={{ color: theme.text }}>
                    of {item.reference}{item.unit}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Toggle button for details */}
      <div className="pl-3 pb-2">
        <button 
          onClick={toggleDetails}
          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: `${theme.cardHighlight}15`,
            color: theme.primary
          }}
        >
          <span className="text-xs font-medium">
            {showDetails ? "Hide Details" : "Show More Nutrition Details"}
          </span>
          {showDetails ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
          }
        </button>
      </div>
      
      {/* Collapsible secondary nutrition details */}
      {showDetails && (
        <div className="pl-3 pb-4 animate-fadeIn">
          <div className="bg-gray-50 rounded-lg p-3" style={{ backgroundColor: `${theme.cardHighlight}10` }}>
            <div className="flex items-center mb-2">
              <Info className="w-3 h-3 mr-1" style={{ color: theme.primary }} />
              <span className="text-xs font-medium" style={{ color: theme.text }}>
                Detailed Nutrition
              </span>
            </div>
            
            <div className="space-y-3">
              {secondaryNutrition.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div style={{ color: theme.primary }} className="mr-1">
                        {item.icon}
                      </div>
                      <span className="text-xs" style={{ color: theme.text }}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs font-medium" style={{ color: theme.text }}>
                        {item.value} {item.unit}
                      </span>
                      <span className="text-xs ml-1 opacity-60" style={{ color: theme.text }}>
                        ({Math.round(item.percentage)}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.color}`}
                      style={{ 
                        width: `${item.percentage}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Nutritional composition visualization */}
      <div className="pl-3 mt-3 pt-2 pb-4 border-t" style={{ borderColor: `${theme.cardHighlight}40` }}>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
          <div className="flex h-full">
            <div className="bg-orange-500 h-full" style={{ width: `${Math.min(primaryNutrition[0].percentage, 25)}%` }}></div>
            <div className="bg-blue-500 h-full" style={{ width: `${Math.min(primaryNutrition[1].percentage, 25)}%` }}></div>
            <div className="bg-yellow-500 h-full" style={{ width: `${Math.min(primaryNutrition[2].percentage, 25)}%` }}></div>
            <div className="bg-red-500 h-full" style={{ width: `${Math.min(primaryNutrition[3].percentage, 25)}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between text-xs opacity-60" style={{ color: theme.text }}>
          <span>Nutritional Breakdown</span>
          <span>Based on {referenceValues.calories} cal diet</span>
        </div>
      </div>
      
      {/* Add animation styles */}
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

export default NutritionCard;