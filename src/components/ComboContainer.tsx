import React from 'react';
import ComboCard from './ComboCard';
import { ComboMeal, useChatContext } from '../context/ChatContext';

interface ComboContainerProps {
  combos: ComboMeal[];
}

const ComboContainer: React.FC<ComboContainerProps> = ({ combos }) => {
  const { dispatch } = useChatContext();

  const handleAddComboToCart = (combo: ComboMeal) => {
    dispatch({
      type: 'ADD_COMBO_TO_CART',
      payload: combo
    });
  };

  if (!combos || combos.length === 0) {
    return null;
  }

  return (
    <div className="pb-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Suggested Meal Combinations</h2>
        <p className="text-sm text-gray-600">Perfectly paired items that complement each other</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {combos.map((combo) => (
          <ComboCard 
            key={combo.id} 
            combo={combo} 
            onAddToCart={handleAddComboToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default ComboContainer;