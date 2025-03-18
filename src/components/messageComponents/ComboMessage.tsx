import React, { useState, useEffect, useRef } from 'react';
import { Message, ComboMeal, RecommendedItem } from '../../types';
import { useChatContext } from '../../context/ChatContext';
import { useFiltersContext } from '../../context/FiltersContext';
import ComboCard from '../ComboCard';

interface ComboMessageProps {
  message: Message;
  selectedStyle?: any;
  chatLogic?: any; 
}

export const ComboMessage: React.FC<ComboMessageProps> = ({
  message,
  selectedStyle,
  chatLogic
}) => {
  
  const { dispatch } = useChatContext();
  const { theme } = useFiltersContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  
  
  const [activeComboId, setActiveComboId] = useState<string | null>(null);
  
  
  
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  
  
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  
  
  
  const [similarItems, setSimilarItems] = useState<Record<string, RecommendedItem[]>>({});
  
  
  
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const [modifiedCombos, setModifiedCombos] = useState<ComboMeal[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  
  const shouldShowSimpleMessage = !message.comboMeals || message.comboMeals.length === 0;
  
  
  useEffect(() => {
    if (message.comboMeals && message.comboMeals.length > 0) {
      
      const limitedCombos = message.comboMeals.slice(0, 2);
      setModifiedCombos(limitedCombos);
      
      
      if (limitedCombos.length > 0) {
        setActiveComboId(limitedCombos[0].id);
        
        
        const initialExpanded: Record<string, boolean> = {};
        limitedCombos.forEach(combo => {
          initialExpanded[combo.id] = false;
        });
        setExpandedState(initialExpanded);
      }
    }
  }, [message.comboMeals]);
  
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSlideDirection(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeIndex]);
  
  
  useEffect(() => {
    if (modifiedCombos.length > 0) {
      const newActiveCombo = modifiedCombos[activeIndex];
      if (newActiveCombo && newActiveCombo.id !== activeComboId) {
        
        setActiveItemIndex(null);
        setActiveComboId(newActiveCombo.id);

      }
    }
  }, [activeIndex, modifiedCombos, activeComboId]);

  const handleAddComboToCart = (combo: ComboMeal) => {
    dispatch({
      type: 'ADD_COMBO_TO_CART',
      payload: combo
    });
  };

  
  const handleToggleExpanded = (comboId: string) => {
    setExpandedState(prev => ({
      ...prev,
      [comboId]: !prev[comboId]
    }));
  };

  
  const isComboExpanded = (comboId: string) => {
    return !!expandedState[comboId];
  };

  
  const getIsLoadingForItem = (comboId: string, itemIndex: number) => {
    const key = `${comboId}_${itemIndex}`;
    return !!loadingStates[key];
  };

  
  const getLoadingStatesForCombo = (comboId: string) => {
    const result: Record<number, boolean> = {};
    
    
    Object.keys(loadingStates).forEach(key => {
      if (key.startsWith(`${comboId}_`)) {
        const itemIndex = parseInt(key.split('_')[1], 10);
        result[itemIndex] = loadingStates[key];
      }
    });
    
    return result;
  };

  
  const getSimilarItemsForCombo = (comboId: string) => {
    const result: Record<string, RecommendedItem[]> = {};
    
    
    Object.keys(similarItems).forEach(key => {
      if (key.startsWith(`${comboId}_`)) {
        result[key] = similarItems[key];
      }
    });
    
    return result;
  };

  
  const handleRegenerateClick = (itemIndex: number) => {
    
    setActiveItemIndex(prevIndex => prevIndex === itemIndex ? null : itemIndex);
  };

  const handleRegenerateItem = async (
    comboId: string,
    itemIndex: number,
    currentItemId: number,
    category?: string
  ): Promise<Record<string, RecommendedItem[]>> => {
    
    if (comboId !== activeComboId) {

      return {};
    }
    
    
    const loadingKey = `${comboId}_${itemIndex}`;
    
    
    setLoadingStates(prev => ({
      ...prev,
      [loadingKey]: true
    }));
    
    try {
      if (chatLogic && typeof chatLogic.getSimilarItemsForCombo === 'function') {
        const newSimilarItems = await chatLogic.getSimilarItemsForCombo(
          comboId,
          itemIndex,
          currentItemId,
          category
        );
        
        setSimilarItems(prev => ({
          ...prev,
          ...newSimilarItems
        }));
        
        return newSimilarItems;
      } else {
        console.error("chatLogic or getSimilarItemsForCombo method is missing");
        return {};
      }
    } catch (error) {
      console.error(`Error getting similar items for combo ${comboId}:`, error);
      return {};
    } finally {
      
      setTimeout(() => {
        setLoadingStates(prev => ({
          ...prev,
          [loadingKey]: false
        }));
      }, 600);
    }
  };

  const handleReplaceItem = (comboId: string, itemIndex: number, newItem: RecommendedItem) => {
    
    if (comboId !== activeComboId) {

      return;
    }
    
    const comboIndex = modifiedCombos.findIndex(c => c.id === comboId);
    if (comboIndex === -1) {
      console.error(`Combo with ID ${comboId} not found for replacement`);
      return;
    }
    
    const currentCombo = modifiedCombos[comboIndex];
    if (!currentCombo.items[itemIndex]) {
      console.error(`Item at index ${itemIndex} not found in combo ${comboId}`);
      return;
    }
    
    const currentItem = currentCombo.items[itemIndex];
    const itemPrice = currentItem.price || 0;
    const newItemPrice = newItem.price || 0;
    
    
    setModifiedCombos(prevCombos => {
      
      const updatedCombos = [...prevCombos];
      
      
      const updatedCombo = {
        ...updatedCombos[comboIndex],
        items: [...updatedCombos[comboIndex].items], 
        totalPrice: updatedCombos[comboIndex].totalPrice - itemPrice + newItemPrice
      };
      
      
      updatedCombo.items[itemIndex] = newItem;
      
      
      updatedCombos[comboIndex] = updatedCombo;
      
      return updatedCombos;
    });
    
    setActiveItemIndex(null);
  };

  const handleDeleteItem = (comboId: string, itemIndex: number) => {
    if (comboId !== activeComboId) {

      return;
    }
    
    
    const comboIndex = modifiedCombos.findIndex(c => c.id === comboId);
    if (comboIndex === -1) {
      console.error(`Combo with ID ${comboId} not found for deletion`);
      return;
    }
    
    const currentCombo = modifiedCombos[comboIndex];
    
    if (currentCombo.items.length <= 1) {

      return;
    }
    
    if (itemIndex < 0 || itemIndex >= currentCombo.items.length) {
      console.error(`Invalid item index ${itemIndex} for combo ${comboId}`);
      return;
    }
    
    const itemToRemove = currentCombo.items[itemIndex];
    const itemPrice = itemToRemove.price || 0;
    
    
    setModifiedCombos(prevCombos => {
      const updatedCombos = [...prevCombos];
      
      const updatedCombo = {
        ...updatedCombos[comboIndex],
        items: updatedCombos[comboIndex].items.filter((_, idx) => idx !== itemIndex),
        totalPrice: updatedCombos[comboIndex].totalPrice - itemPrice
      };
      
      updatedCombos[comboIndex] = updatedCombo;
      
      return updatedCombos;
    });
    
    setActiveItemIndex(null);
  };

  const goToPrevious = () => {
    if (modifiedCombos.length <= 1) return;
    
    setActiveItemIndex(null);
    
    setSlideDirection('left');
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? modifiedCombos.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    if (modifiedCombos.length <= 1) return;
    
    setActiveItemIndex(null);
    
    setSlideDirection('right');
    setActiveIndex((prevIndex) => 
      prevIndex === modifiedCombos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (shouldShowSimpleMessage || modifiedCombos.length === 0) {
    return (
      <>
        <div className="pr-3 flex-shrink-0 flex mb-3">
          {selectedStyle && (
            <img
              src={selectedStyle.image}
              alt={selectedStyle.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-secondary mr-2"
            />
          )}
          <div className="text-[13px] flex-1" style={{ color: theme.text }}>{message.text}</div>
        </div>
      </>
    );
  }

  const safeActiveIndex = Math.min(activeIndex, modifiedCombos.length - 1);
  const activeCombo = modifiedCombos[safeActiveIndex];

  return (
    <div className="combo-message">
      <div className="pr-3 flex-shrink-0 flex mb-3">
        {selectedStyle && (
          <img
            src={selectedStyle.image}
            alt={selectedStyle.name}
            className="w-8 h-8 rounded-full object-cover border-2 border-secondary mr-2"
          />
        )}
        <div className="text-[13px] flex-1" style={{ color: theme.text }}>{message.text}</div>
      </div>
      
      <div 
        className="relative mb-4 p-1"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}05)`,
          borderRadius: '12px',
        }}
      >
        <div className="flex justify-between items-center mb-3 px-3 pt-2">
          <div className="flex items-center">
            <span
              className="inline-block mr-2 w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: theme.primary }}
            ></span>
            <h3 
              className="text-sm font-medium"
              style={{ color: theme.text }}
            >
              Perfect Meal Combinations
            </h3>
          </div>
          
          {modifiedCombos.length > 1 && (
            <div className="flex space-x-1">
              {modifiedCombos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveItemIndex(null);
                    setSlideDirection(index > safeActiveIndex ? 'right' : 'left');
                    setActiveIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    safeActiveIndex === index ? 'w-5 opacity-100' : 'opacity-40'
                  }`}
                  style={{ 
                    backgroundColor: safeActiveIndex === index ? theme.primary : theme.text || 'gray'
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        <div 
          ref={carouselRef}
          className="carousel-container relative overflow-hidden p-1"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div 
            className={`carousel-item transition-transform duration-300 ease-in-out ${
              slideDirection === 'right' ? 'animate-slide-left' : 
              slideDirection === 'left' ? 'animate-slide-right' : ''
            }`}
          >
            <ComboCard 
              key={`combo-card-${activeCombo.id}-${safeActiveIndex}`}
              combo={activeCombo}
              onAddToCart={handleAddComboToCart}
              onRegenerateItem={handleRegenerateItem}
              onDeleteItem={handleDeleteItem}
              onReplaceItem={handleReplaceItem}
              similarItems={getSimilarItemsForCombo(activeCombo.id)}
              isLoading={getLoadingStatesForCombo(activeCombo.id)}
              activeItemIndex={activeItemIndex}
              onRegenerateClick={handleRegenerateClick}
              isExpanded={isComboExpanded(activeCombo.id)}
              onToggleExpanded={() => handleToggleExpanded(activeCombo.id)}
            />
          </div>
          
          {modifiedCombos.length > 1 && (
            <div className="carousel-navigation flex justify-between absolute top-1/2 left-2 right-2 transform -translate-y-1/2 pointer-events-none">
              <button 
                onClick={goToPrevious}
                className="w-8 h-8 flex items-center justify-center rounded-full shadow-md z-10 transform transition-transform duration-200 hover:scale-110 pointer-events-auto"
                style={{ 
                  backgroundColor: `${theme.cardBg}aa`,
                  color: theme.text,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={goToNext}
                className="w-8 h-8 flex items-center justify-center rounded-full shadow-md z-10 transform transition-transform duration-200 hover:scale-110 pointer-events-auto"
                style={{ 
                  backgroundColor: `${theme.cardBg}aa`,
                  color: theme.text,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};